'use strict';

const deep = require('deep-object-js')
const Alexa = require('alexa-sdk');
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' })

const getWinner = cb => {
    dynamo.scan({
        TableName: 'People'
    }, (err, data) => cb(err, data))
}

const putWinner = (email, cb) => {
    dynamo.put({
        TableName: 'Winner',
        Item: {
            email,
            created: new Date().toJSON()
        }
    }, (err, data) => cb(err, data))
}
const handlers = {
    'LaunchRequest': function () {
        this.emit(':ask', "Okay! What you want?");
    },
    'Repeat': function () {
        let repeat = deep.get(this.event, 'request.intent.slots.myText.value');
        this.emit(':ask', repeat);
    },
    'AskDrawLots': function () {
        this.attributes['action'] = 'drawLots';
        this.emit(':ask', "Do you want to make a draw lots?");
    },
    'AMAZON.YesIntent': function () {
        if (this.attributes['action'] === 'drawLots') {
            getWinner((err, data) => {
                if(err) {
                    console.log('get', err)
                    return this.emit(':tell', `There was a problem in drawing the winner`);
                }
                
                if(data.Items.length === 0) return this.emit(':tell', `There are no people registered in the draw`);
                let winner = data.Items[Math.floor(Math.random() * data.Items.length)].email;

                putWinner(winner, (err, data) => {
                    if(err) {
                        console.log('put', err)
                        return this.emit(':tell', `There was a problem in drawing the winner`);
                    }
                    this.emit(':tell', winner);
                })
            })
        } else {
            this.emit(':tell', `Well, ok`);
        }
    },
    'AMAZON.NoIntent': function () {
        delete this.attributes['action'];
        this.emit(':tell', "Well, ok no");
    },
    'AMAZON.FallbackIntent': function () {
        this.emit(':tell', 'Fallback');
    },
    'AMAZON.HelpIntent': function () {
        this.emit('LaunchRequest');
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', 'bye')
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', 'bye')
    },
}

module.exports.run = function (event, context, callback) {
    console.log('event string', JSON.stringify(event));
    const alexa = Alexa.handler(event, context, callback);
    alexa.registerHandlers(handlers);
    alexa.execute();
};
//, 'sorry. I did not understand'