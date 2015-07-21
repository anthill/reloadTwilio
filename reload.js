"use strict";

require("es6-shim");

var fs = require('fs');
var csv = require('csv-parser');
var glob = require("glob");
var requestify = require('requestify');

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

var uniques = new Set();

glob('data/*.csv', function (er, files) {

    files.forEach(function(file){
        fs.createReadStream(file)
            .pipe(csv({separator: ','}))
            .on('data', function(sms) {

                // if this message was not already persited
                if (!uniques.has(sms.From + sms.Body)){
                    uniques.add(sms.From + sms.Body);
                    if (sms.Body[0] === "1") {
                        requestify.post('https://6element.ants.builders/twilio', {
                                Body: sms.Body,
                                From: sms.From
                            })
                            .then(function(response) {
                                console.log(response.code);
                            });
                    }
                }

            })
    })
});



