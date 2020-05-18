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
        console.log(event.headers);
        let recipients = JSON.parse(event.body).records;
        let smsReport = {
            sent: 0,
            failed: 0
        };
        console.log("chito was here 1");
        let tracked_link_url = event.queryStringParameters.tracked_link_url || event.headers['X-Sms-Tracked-Link-Url'] || event.headers['x-sms-tracked_link_url'];
        if(tracked_link_url){
            axiosThrottle.init(axios,20)
        }
        await Promise.all(recipients.map(async (recipient) => {
            console.log("chito was here 2");
            let message = event.queryStringParameters.message || event.headers['X-Sms-Message'] || event.headers['x-sms-message'];
            let decodedMessage = decodeURIComponent(message.replace(/\+/g,  " "));
            let template_fields = decodedMessage.match(/[^[\]]+(?=])/g);
            template_fields.forEach(function(item){                 
                let regx = new RegExp("\\["+item+"\\]","g");
                if(recipient[item]){
                    decodedMessage = decodedMessage.replace(regx,recipient[item]);
                }
            });
            console.log("chito was here 3");
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
            console.log("chito was here 4");
            let queryparams = querystring.stringify(params);
            console.log("chito was here 5");
            const options = {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'authorization': event.headers['Authorization']
                },
                url: 'https://sendsms.transmitsms.com/send-sms-fast?' + queryparams
            };
            console.log("chito was here 6");
            if(params.tracked_link_url){
                options.url = 'https://api.transmitsms.com/send-sms.json?' + queryparams;
            }
            console.log("chito was here 7");
            await axios(options)
                .then(function(resp){
                    console.log("chito was here 8");
                    smsReport.sent++;
                    delete options.headers
                    console.log(options,resp.data);
                })
                .catch(function (error) {
                    console.log("chito was here 9");
                    smsReport.sent++;
                    delete options.headers
                    console.log(options,error);
                });
        }));

        console.log("chito was here 10");
        let response = {
            statusCode : 200,
            headers : {"Content-Type": 'application/json' },
            body : JSON.stringify(smsReport)
        };
        console.log("chito was here 11");
        return response;
        
    } catch (err) {
        console.log("chito was here 12",err);        
        return err;
    }

};
