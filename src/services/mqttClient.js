import mqtt from 'mqtt';

export function connectMqtt({
  url = 'ws://test.mosquitto.org:8080/mqtt',
  topic,
  qos = 0,
  clientId = `luixxa-web-${Math.random().toString(16).slice(2)}`,
  keepalive = 30,
  onMessage,
}) {
  const options = {
    clientId,
    keepalive,
    clean: true,
    reconnectPeriod: 3000,
  };

  const client = mqtt.connect(url, options);

  client.on('connect', () => {
    if (topic) {
      client.subscribe(topic, { qos }, (err) => {
        if (err) {
          console.error('MQTT subscribe error:', err);
        }
      });
    }
  });

  client.on('message', (receivedTopic, payload) => {
    try {
      const text = payload.toString();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        const match = /(-?\d+(?:\.\d+)?)/.exec(text);
        const value = match ? parseFloat(match[1]) : null;
        data = { temperatura: value, nombre: 'sensor', raw: text };
      }

      if (typeof onMessage === 'function') {
        onMessage({ topic: receivedTopic, data });
      }
    } catch (err) {
      console.error('MQTT message handling error:', err);
    }
  });

  client.on('error', (err) => {
    console.error('MQTT client error:', err);
  });

  const disconnect = () => {
    try {
      client.end(true);
    } catch (e) {
      console.error('MQTT disconnect error:', e);
    }
  };

  return { client, disconnect };
}