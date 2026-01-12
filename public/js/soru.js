function Soru(soruMetni, cevapSecenekleri, dogruCevap) {
  this.soruMetni = soruMetni;
  this.cevapSecenekleri = cevapSecenekleri;
  this.dogruCevap = dogruCevap;
}

Soru.prototype.cevabiKontrolEt = function (cevap) {
  return cevap === this.dogruCevap;
};

let sorular = [
  new Soru(
    "1-Hangisi JS paket yönetim uygulamasıdır?",
    { a: "Node.js", b: "typescript", c: "NPM" },
    "c"
  ),
  new Soru(
    "2-Hangisi JS paket yönetim uygulamasıdır?",
    { a: "Node.js", b: "typescript", c: "NPM" },
    "c"
  ),
  new Soru(
    "3-Hangisi JS paket yönetim uygulamasıdır?",
    { a: "Node.js", b: "typescript", c: "NPM" },
    "c"
  ),
  new Soru(
    "4-Hangisi JS paket yönetim uygulamasıdır?",
    { a: "Node.js", b: "typescript", c: "NPM" },
    "c"
  ),
];
