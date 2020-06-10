 const axios = require('axios');
 const axiosThrottle = require('axios-throttle'); 
 const querystring = require('querystring');

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
exports.sendSMSFastHandler = async (event, context) => {
    try {

        if(event.body == null || JSON.parse(event.body) == null || JSON.parse(event.body).records == null){
           
            let response = {
                statusCode : 400,
                headers : {"Content-Type": 'application/json' },
                body : JSON.stringify({"message":"Records not set"})
            };
            return response;
        }
        else {

            let recipients = JSON.parse(event.body).records;
            let smsReport = {
                sent: 0,
                failed: 0
            };
            
            if(event.queryStringParameters == null){
                event.queryStringParameters = {};
            }

            let tracked_link_url = event.queryStringParameters.tracked_link_url || event.headers['X-Sms-Tracked-Link-Url'] || event.headers['x-sms-tracked_link_url'];
            let message = JSON.parse(event.body).custom;
            if(tracked_link_url){
                axiosThrottle.init(axios,25)
            }
            if(message != null && message != ''){
                await Promise.all(recipients.map(async (recipient) => {
                    
                    let decodedMessage = message;
                    let template_fields = decodedMessage.match(/[^[\]]+(?=])/g);
                    if(template_fields && template_fields.length){
                        template_fields.forEach(function(item){                 
                            let regx = new RegExp("\\["+item+"\\]","g");
                            if(recipient[item]){
                                decodedMessage = decodedMessage.replace(regx,recipient[item]);
                            }
                        });
                    }

                    let params = {
                        message: decodedMessage,
                        to: recipient.MobilePhone,
                        countrycode: recipient.MailingCountry || event.queryStringParameters.default_country || event.headers['X-Sms-Default-County'] || event.headers['x-sms-default_county'],
                        from: event.queryStringParameters.from || event.headers['X-Sms-From'] || event.headers['x-sms-from'],
                        send_at: event.queryStringParameters.send_at || event.headers['X-Sms-Send-At'] || event.headers['x-sms-send_at'],
                        smsfast_callback_url: event.queryStringParameters.smsfast_callback_url || event.headers['S-Sms-Smsfast-Callback-Url'] || event.headers['x-sms-smsfast_callback_url'],
                        dlr_callback: event.queryStringParameters.dlr_callback || event.headers['X-Sms-Dlr_Callback'] || event.headers['x-sms-dlr_callback'],
                        reply_callback: event.queryStringParameters.reply_callback || event.headers['X-Sms-Reply_Callback'] || event.headers['x-sms-reply_callback'],
                        validity: event.queryStringParameters.validity || event.headers['X-Sms-Validity'] || event.headers['x-sms-validity'],
                        replies_to_email: event.queryStringParameters.replies_to_email || event.headers['X-Sms-Replies-To-Email'] || event.headers['x-sms-replies_to_email'],
                        list_id: event.queryStringParameters.list_id || event.headers['X-Sms-List-Id'] || event.headers['x-sms-list_id'],
                        from_shared: event.queryStringParameters.from_shared || event.headers['X-Sms-From-Shared'] || event.headers['x-sms-from_shared'],
                        tracked_link_url: tracked_link_url
                    };

                    let queryparams = querystring.stringify(params);

                    const options = {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'authorization': event.headers['Authorization']
                        },
                        url: 'https://sendsms.transmitsms.com/send-sms-fast?' + queryparams
                    };

                    if(params.tracked_link_url){
                        options.url = 'https://api.transmitsms.com/send-sms.json?' + queryparams;
                    }

                    await axios(options)
                        .then(function(resp){

                            smsReport.sent++;
                            delete options.headers
                            console.log(options,resp.data);
                        })
                        .catch(function (error) {

                            smsReport.failed++;
                            delete options.headers
                            console.log(options,error);
                        });
                }));
                let response = {
                    statusCode : 200,
                    headers : {"Content-Type": 'application/json' },
                    body : JSON.stringify(smsReport)
                };
                return response;
            }
            else{
                let response = {
                    statusCode : 400,
                    headers : {"Content-Type": 'application/json' },
                    body : JSON.stringify({"message":"Message not set"})
                };
                return response;
            }
        }
        
    } catch (err) {

        console.log(err, event.headers, event.body);    
        let response = {
            statusCode : 500,
            headers : {"Content-Type": 'application/json' },
            body : JSON.stringify({"message":"Internal server error"})
        };
            
        return response;
    }

};
