function onInit() {
  self.postMessage({ type: 'subscribe' });
}

function onSignal(data) {
  console.log(data);
}
