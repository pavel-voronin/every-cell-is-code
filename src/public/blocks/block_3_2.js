function onInit() {
  self.postMessage({ type: 'subscribe' });
}

function onMessage(data) {
  console.log(data);
}
