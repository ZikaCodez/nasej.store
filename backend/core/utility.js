function random6Digit() {
  return Math.floor(100000 + Math.random() * 900000);
}

module.exports = {
    random6Digit,
};