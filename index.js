const fetch = require('node-fetch');
const es = require('event-stream');

exports.run = function run(key, query, pipeFunction, onFinish) {
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
                //console.log('Sync finished!')
                if (onFinish) {
                    onFinish();
                }
            }).pipe(es.split())
                .pipe(es.map((data, callback) => {
                    if (data) {
                        let d = JSON.parse(data);
                        pipeFunction(d);

                    }
                }))
        })}

exports.getStatus = async function () {
    return new Promise(resolve => {
        fetch('https://txo.bitbus.network/status').then(async res => {
            var result = await res.json();
            resolve(result);
        }
        )
    })
}