 const axios = require('axios');
// const url = 'http://checkip.amazonaws.com/';
 const querystring = require('querystring');
 let response;

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
        console.log("====================",event.headers);
        // const ret = await axios(url);
        

        let recipients = JSON.parse(event.body).records;
        let smsReport = {
            sent: 0,
            failed: 0
        };
 
        await Promise.all(recipients.map(async (recipient) => {
            let params = {
                message: event.queryStringParameters.message || event.headers['X-Sms-Message'],
                to: recipient.MobilePhone,
                countrycode: recipient.MailingCountry || event.queryStringParameters.default_country || event.headers['X-Sms-Default-County'],
                from: event.queryStringParameters.from || event.headers['X-Sms-From'],
                send_at: event.queryStringParameters.send_at || event.headers['X-Sms-Send-At'],
                smsfast_callback_url: event.queryStringParameters.smsfast_callback_url || event.headers['S-Sms-Smsfast-Callback-Url'],
                dlr_callback: event.queryStringParameters.dlr_callback || event.headers['X-Sms-Dlr_Callback'],
                reply_callback: event.queryStringParameters.reply_callback || event.headers['X-Sms-Reply_Callback'],
                validity: event.queryStringParameters.validity || event.headers['X-Sms-Validity'],
                replies_to_email: event.queryStringParameters.replies_to_email || event.headers['X-Sms-Replies-To-Email'],
                list_id: event.queryStringParameters.list_id || event.headers['X-Sms-List-Id'],
                from_shared: event.queryStringParameters.from_shared || event.headers['X-Sms-From-Shared'],
                tracked_link_url: event.queryStringParameters.tracked_link_url || event.headers['X-Sms-Tracked-Link-Url']
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

            if(params.list_id || params.tracked_link_url){
                options.url = 'https://api.transmitsms.com/send-sms.json?' + queryparams;
            }
        
            await axios(options)
                .then(function(resp){
                    smsReport.sent++;
                    delete options.headers
                    console.log(options,resp.data);
                })
                .catch(function (error) {
                    smsReport.sent++;
                    delete options.headers
                    console.log(options,error);
                });
        }));


        return response = {
            'statusCode': 200,
            'body': smsReport
        };
        
    } catch (err) {
        
        return err;
    }

    // return response
};
