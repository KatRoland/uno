const cardgen = (numberofcards) => {
    let generatedcards = [];
    for (let i = 0; i < numberofcards; i++) {
        let card = Math.floor(Math.random() * (52 - 0 + 1) ) + 0;

        console.log(card)

        switch(card){
            case 0:
                card = "aa";
                break;
            case 1:
                card = "p0";
                break;
            case 2:
                card = "p1";
                break;
            case 3:
                card = "p2";
                break;
            case 4:
                card = "p3";
                break;
            case 5:
                card = "p4";
                break;
            case 6:
                card = "p5";
                break;
            case 7:
                card = "p6";
                break;
            case 8:
                card = "p7";
                break;
            case 9:
                card = "p8";
                break;
            case 10:
                card = "p9";
                break;
            case 11:
                card = "z0";
                break;
            case 12:
                card = "z1";
                break;
            case 13:
                card = "z2";
                break;
            case 14:
                card = "z3";
                break;
            case 15:
                card = "z4";
                break;
            case 16:
                card = "z5";
                break;
            case 17:
                card = "z6";
                break;
            case 18:
                card = "z7";
                break;
            case 19:
                card = "z8";
                break;
            case 20:
                card = "z9";
                break;
            case 21:
                card = "k0";
                break;
            case 22:
                card = "k1";
                break;
            case 23:
                card = "k2";
                break;
            case 24:
                card = "k3";
                break;
            case 25:
                card = "k4";
                break;
            case 26:
                card = "k5";
                break;
            case 27:
                card = "k6";
                break;
            case 28:
                card = "k7";
                break;
            case 29:
                card = "k8";
                break;
            case 30:
                card = "k9";
                break;
            case 31:
                card = "s0";
                break;
            case 32:
                card = "s1";
                break;
            case 33:
                card = "s2";
                break;
            case 34:
                card = "s3";
                break;
            case 35:
                card = "s4";
                break;
            case 36:
                card = "s5";
                break;
            case 37:
                card = "s6";
                break;
            case 38:
                card = "s7";
                break;
            case 39:
                card = "s8";
                break;
            case 40:
                card = "s9";
                break;
            case 41:
                card = "pk";
                break;
            case 42:
                card = "zk";
                break;
            case 43:
                card = "kk";
                break;
            case 44:
                card = "sk";
                break;
            case 45:
                card = "pr";
                break;
            case 46:
                card = "zr";
                break;
            case 47:
                card = "kr";
                break;
            case 48:
                card = "sr";
                break;
            case 49:
                card = "pb";
                break;
            case 50:
                card = "zb";
                break;
            case 51:
                card = "kb";
                break;
            case 52:
                card = "sk";
                break;
        }   

        generatedcards.push(card);
      }
      return generatedcards;
}

const startgen = () => {
    const disabled = ["aa","pk","zk","kk","sk","pr","zr","kr","sr","pb","zb","kb","sb"]
    let currentcard;
    do {
        currentcard = cardgen(1)[0];
        console.log(currentcard)
    } while(disabled.includes(currentcard))
    
    return currentcard
}

module.exports = {cardgen, startgen};