const { InfluxDB } = require('@influxdata/influxdb-client');
const axios = require('axios');

class Influx {
  constructor(orgName, bucketName) {
    this.orgName = orgName;
    this.bucketName = bucketName;
    this.batchOptions = {
      flushInterval: 1000,
      batchSize: 10,
    };
    this.client = new InfluxDB({
      url: process.env.INFLUX_URL,
      token: process.env.INFLUX_TOKEN,
    });
    this.queryClient = this.client.getQueryApi(this.orgName);
    this.writeClient = this.client.getWriteApi(
      this.orgName,
      this.bucketName,
      'ms',
      this.batchOptions,
    );
  }

  async getRetentionPolicy() {
    try {
      const response = await axios.get('http://localhost:8086/api/v2/buckets', {
        headers: {
          Authorization: `Token ${process.env.INFLUX_TOKEN}`,
        },
      });

      const buckets = response.data.buckets;

      if (buckets && buckets.length > 0) {
        const pnsBucket = buckets.find(bucket => bucket.name === 'pnsBucket');
        const retentionRule = pnsBucket.retentionRules[0];

        if (retentionRule && retentionRule.type === 'expire') {
          const seconds = retentionRule.everySeconds;
          const unit = seconds >= 86400 ? 'd' : 'h'; // Adjust as needed

          const value = unit === 'd' ? seconds / 86400 : seconds / 3600;
          return { value, unit };
        }
      }

      return { value: 0, unit: 'h' };
    } catch (error) {
      console.error('Error fetching buckets:', error);
      return { value: 0, unit: 'h' };
    }
  }
}

module.exports = Influx;
