const fetch = require('node-fetch');
const es = require('event-stream');
const { sleep,  Queue } = require('./utils.js')

exports.run = function run(key, query, process, callback) {
    var queue = new Queue();
    var draining = false;

    async function drainQueue() {
        return new Promise(async resolve => {
            draining = true;
            while (queue.getLength() > 0) {
                if (process.constructor.name == 'AsyncFunction') {
                    var tx = queue.dequeue();
                    await process(tx);
                } else {
                    var tx = queue.dequeue();
                    process(tx);
                }
            }
            draining = false;
            resolve();
        })


    }

    async function onSyncFinish() {
        if(!drainQueue&&(queue.getLength()>0)){
            await drainQueue();
        }
        while(draining){
            await sleep(500)
        }
        if(callback){
            callback();
        }

    }

    fetch("https://txo.bitbus.network/block", {
        method: "post",
        headers: {
            'Content-type': 'application/json; charset=utf-8',
            'token': key
        },
        body: JSON.stringify(query)
    })
        .then((res) => {
            res.body.on("end", () => {
                onSyncFinish();
            }).pipe(es.split())
                .pipe(es.map((data, callback) => {
                    if (data) {
                        let d = JSON.parse(data);
                        queue.enqueue(d);
                        if (!draining) {
                            drainQueue();
                        }
                        callback();
                    }
                }))
        })
}

exports.getStatus = async function () {
    return new Promise(resolve => {
        fetch('https://txo.bitbus.network/status').then(async res => {
            var result = await res.json();
            resolve(result);
        }
        )
    })
}