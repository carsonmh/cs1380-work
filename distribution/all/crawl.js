function crawl (config) {
    const context = {};
    context.gid = config.gid || 'all';
    function runCrawler(config, callback) {
        const remote = {service: 'crawl', method: 'startCrawl'}
        distribution[context.gid].comm.send(['test message'], remote, (e, v) => {
            callback(e, v)
        })
    }

    return {runCrawler}
};

module.exports = crawl;
