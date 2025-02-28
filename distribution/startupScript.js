function startupScript() {
    const distribution = require('/usr/src/app/stencil/config')
    let kvMap = {};

    distribution.local.groups.put('all', {
        'n1': {ip: '127.0.0.1', port: 1000},
        'n2': {ip: '127.0.0.1', port: 1001},
        'n3': {ip: '127.0.0.1', port: 1003}
    })

    for(let i = 0; i < 1000; i++) {
        kvMap[i.toString()] = {i: i.toString()};
    }


    function queryAllObjects() {
        let queryStartTime = performance.now();
        let queryAmountIterated = 0;
        for(const [key, value] of Object.entries(kvMap)) {
            distribution.all.store.get(key, (e, v) => {
                if(e) {
                    console.log(`error!` + e);
                }

                queryAmountIterated += 1;
                if(queryAmountIterated >= 1000) {
                    let queryEndTime = performance.now();
                    console.log(`total time to get: `, queryEndTime - queryStartTime);
                }
            })
        }
    }

    let startTime = performance.now();
    let endTime = null;
    let amountIterated = 0;
    for(const [key, value] of Object.entries(kvMap)) {
        distribution.all.store.put(value, key, (e, v) => {
            if(e) {
                console.log(`error!` + e);
            }
            amountIterated += 1;
            if(amountIterated >= 1000) {
                endTime = performance.now();
                console.log(`time to put all objects: `, endTime - startTime);
                queryAllObjects();
            }
        })
    }
}

module.exports = startupScript

/*

{"type":"object","value":{"ip":"{\"type\":\"string\",\"value\":\"127.0.0.1\"}","port":"{\"type\":\"number\",\"value\":\"8080\"}","onStart":"{\"type\":\"function\",\"value\":\"s => {console.log(`hi`)}\"}"}}

*/