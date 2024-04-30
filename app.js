const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const cookieParser = require('cookie-parser')
var cookie = require("cookie")
const {cardgen, startgen} = require("./cards")

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: 'false' }))
app.use(express.json());
app.use(cookieParser());
app.use(express.static(__dirname + '/views'));

var nickname;

function nicknamecheck(req,res){
  if(req.cookies.username){
    nickname = req.cookies.username;
    return true
  } else {
    res.render("username")
  }
}

// function cardgen(numberofcards) 
// {
//   var generatedcards = [];
//   for (let i = 0; i < numberofcards; i++) {
//     generatedcards.push(Math.floor(Math.random() * (52 - 0 + 1) ) + 0);
//   }
//   return generatedcards;
// }

app.get('/', function(req, res) {
  if(nicknamecheck(req,res)){
    res.render("index")
  }
});

var rname;
// szobák
let rooms = {};
let games = {};

let users = {};

setInterval(() => {
  console.log("----------")
  console.log("szobák:" + JSON.stringify(rooms))
  console.log("----------")
  console.log("gamek:" + JSON.stringify(games))
  console.log("----------")
  console.log("playerek:" + JSON.stringify(users))
  console.log("----------")
}, 10000);

app.get("/room/:roomname", function(req,res) {
  const {roomname} = req.params;
  rname = roomname;
  if (Object.keys(rooms).includes(rname)) {
    if(req.cookies.username){
  nickname = req.cookies.username;
  res.render("room");
} else {
  res.render("username")
}
}
else {
  res.redirect("/")
}
})

app.post("/setusername", function(req,res) {
  const {uname} = req.body;
  if(uname.length >= 3){
  res.cookie(`username`,uname);
  res.redirect("back")
} else{
  res.render("username")
}
})


// Kliens csatlakozáskor
io.on('connection', function(socket) {
  console.log('A user connected, id: ' + socket.id);
  //console.log(socket);
  var cookies = cookie.parse(socket.handshake.headers.cookie);
  if(cookies.username){
    socket.nickname = cookies.username
    users[socket.nickname] = {name: socket.nickname, path: socket.request.headers.referer}
    console.log('A user connected, uname: ' + socket.nickname);
  }
  console.log(io.sockets.adapter.rooms)
  console.log("-.-.--.--.-.-.-.-.-")
  console.log(io.sockets.connected)

    // Lobbyba lépés
  socket.join('lobby');

  // Kiküldi a jelenleg lévő szobákat
  socket.emit('roomList', rooms);

  // Szoba létrehozáskor

  // Szobába lépéskor
  socket.on('joinRoom', () => {
    // vizsgálat
// rooms[rname].players
    if(Object.keys(rooms).includes(rname) && rooms[rname].status == "started" && !Object.keys(games[Object.keys(games).filter(i => games[i].room === rname)].players).includes(socket.nickname)) {
      //io.to(socket.id).emit("isstarted")
      let gameid = Object.keys(games).filter(i => games[i].room === rname)
      console.log("\n\n\n\n\n\n\n")
      console.log(gameid)

                
                  games[gameid].spectators[socket.nickname] = {name: socket.nickname, id: socket.id}

                  
                Object.values(games[gameid].spectators).forEach(spectator => {
                  // console.log(player)
                  console.log("----------------")
                // let game = {currentcard: games[gameid].currentcard, currentplayer: games[gameid].currentplayer, pendingcards: games[gameid].pendingcard, order: games[gameid].order, next: games[gameid].order[games[gameid].order.indexOf(games[gameid].currentcard) + 1] ? games[gameid].order[games[gameid].order.indexOf(games[gameid].currentcard) + 1] : games[gameid].order[0] };
                  // game.opponents = {}
      
      
                  // console.log(player)
                  console.log("----------------")
                  // console.log(player.id)
                  // console.log(games[gameid].currentplayer)
                  io.to(spectator.id).emit('spectatorreload', games[gameid],games[gameid].status);
                  // console.log(player.name)
                });
                

                

      
    } 
    else {

    

      if(rooms[rname] && !(Object.keys(rooms[rname].players).includes(socket.nickname))){
        console.log("TESZT SZÖVEG")
        console.log(socket.id)
      // Belépés a szobába
      socket.join(rname);
      rooms[rname].players[socket.nickname] = {Name: socket.nickname, id: socket.id}
      socket.room = rname
      
      // Kilépés a lobbyból
      socket.leave("lobby")
      io.in("lobby").emit('reloadRoom', rooms[rname])

      let roomgame
      if(rooms[socket.room].status == "started"){
        for(let gamename in games){
          let game = games[gamename]
          console.log(game)
          let player = Object.values(games[gamename].players).filter(player => player.name === socket.nickname)
          if(game.room == socket.room){
            roomgame = {personaldata: {playerinfo: player[0], gameid: gamename},currentcard: game.currentcard, currentplayer: game.currentplayer, status: game.status, order: game.order};
            roomgame.opponents = {};
            
            console.log("é.é.é.é.")
            console.log(player)
            player = player[0]
            Object.values(games[gamename].players).forEach(opponent => {
              console.log(opponent.name == player.name, opponent.name, player.name)
              if(opponent.name == socket.nickname) {
                return;
              }
              roomgame.opponents[opponent.name] = {name: opponent.name, cards: opponent.cards.length};
              console.log(roomgame.opponents[opponent.name]);
            });

            break;
          }
        }
      } else {
        roomgame = "N/A"
      }


      socket.emit('roomload', rooms[socket.room], socket.room, roomgame);
      io.in(rname).emit('playerlist', Object.keys(rooms[rname].players));

      }else if(rooms[rname] && (Object.keys(rooms[rname].players).includes(socket.nickname) && !socket.room )){
        socket.join(rname);
        socket.room = rname

        rooms[rname].players[socket.nickname].id = socket.id
  
        // Kilépés a lobbyból
        socket.leave("lobby")
  
        let roomgame
        if(rooms[socket.room].status == "started"){
          for(let gamename in games){
            let game = games[gamename]
            console.log(game)
            let player = Object.values(games[gamename].players).filter(player => player.name === socket.nickname)
          console.log(player)

            if(game.room == socket.room){
              game.players[socket.nickname].id = socket.id
              roomgame = {personaldata: {playerinfo: player[0], gameid: gamename},currentcard: game.currentcard, currentplayer: game.currentplayer, status: game.status, order: game.order};
              roomgame.opponents = {};

              Object.values(games[gamename].players).forEach(opponent => {
                if(opponent.name == socket.nickname) {
                  return;
                }
                roomgame.opponents[opponent.name] = {name: opponent.name, cards: opponent.cards.length};
                console.log(roomgame.opponents[opponent.name]);
              });

              break;
            }
          }
        } else {
          roomgame = "N/A"
        }


        socket.emit('roomload', rooms[socket.room], socket.room,roomgame);
        io.in(rname).emit('playerlist', Object.keys(rooms[rname].players));
      }
      else{
        socket.emit('joinError')
      }
    }
  });

socket.on('start', function () {
  if(socket.room){
  if(socket.nickname == rooms[socket.room].owner){
  if(rooms[socket.room].status == "waiting"){
  rooms[socket.room].status = "started"
  io.in(socket.room).emit('gamestarted');
  let gameid = Math.random().toString(36).substring(2)
  console.log(gameid)
  games[gameid] = {};
  games[gameid].id = gameid; 
  games[gameid].room = socket.room;
  games[gameid].players = {};
  games[gameid].spectators = {}
  Object.values(rooms[rname].players).forEach(player => {
    console.log(player);
    games[gameid].players[player.Name] = {id: player.id ,name: player.Name, cards: [...cardgen(5)]};
  });

  games[gameid].currentcard = startgen();
  games[gameid].currentplayer = Object.keys(rooms[socket.room].players)[Math.floor(Math.random() * Object.keys(rooms[socket.room].players).length)];
  games[gameid].order = [games[gameid].currentplayer];

  let playerstmp = Object.keys(rooms[socket.room].players);
  let playertmp = playerstmp.indexOf(games[gameid].currentplayer);
  for (let i = 0; i < playerstmp.length-1; i++) {
    playertmp++;
    if(playertmp >= playerstmp.length){
      playertmp = 0;
    }
    games[gameid].order.push(playerstmp[playertmp])
  }

  games[gameid].pendingcard = 0;

  Object.values(games[gameid].players).forEach(player => {
    // console.log(player)
    console.log("----------------")
    let personaldata = {playerinfo: player, gameid: gameid};
    let game = {currentcard: games[gameid].currentcard, currentplayer: games[gameid].currentplayer, pendingcards: games[gameid].pendingcard, order: games[gameid].order, next: games[gameid].order[games[gameid].order.indexOf(games[gameid].currentcard) + 1] ? games[gameid].order[games[gameid].order.indexOf(games[gameid].currentcard) + 1] : games[gameid].order[0] };
    game.opponents = {}
    Object.values(games[gameid].players).forEach(opponent => {
      if(opponent.name == player.name) {
        return;
      }
      game.opponents[opponent.name] = {name: opponent.name, cards: opponent.cards.length};
      console.log(game.opponents[opponent.name]);
    });
    
    console.log(player)
    console.log("----------------")
    console.log(player.id)
    io.to(player.id).emit('gamestart', personaldata, game)
  });

}
}
}

})

socket.on("drawcard", async (gameid) => {

  console.log(gameid)

  let game = games[gameid]

  console.log(game.players[game.currentplayer].cards.filter(card =>  card[1] == "a" || card[0] == game.currentcard[0] || card[1] == game.currentcard[1]))

  while(game.players[game.currentplayer].cards.filter(card =>  card[1] == "a" || card[0] == game.currentcard[0] || card[1] == game.currentcard[1]).length == 0) {
    game.players[game.currentplayer].cards.push(...cardgen(1));

    Object.values(games[gameid].players).forEach(player => {
      // console.log(player)
      console.log("----------------")
    let game = {currentcard: games[gameid].currentcard, currentplayer: games[gameid].currentplayer, pendingcards: games[gameid].pendingcard, order: games[gameid].order, next: games[gameid].order[games[gameid].order.indexOf(games[gameid].currentcard) + 1] ? games[gameid].order[games[gameid].order.indexOf(games[gameid].currentcard) + 1] : games[gameid].order[0] };
      game.opponents = {}
      Object.values(games[gameid].players).forEach(opponent => {
        if(opponent.name == player.name) {
          return;
        }
        game.opponents[opponent.name] = {name: opponent.name, cards: opponent.cards.length};
        console.log(game.opponents[opponent.name]);
      });
      console.log(player)
      console.log("---------..................................-------")
      console.log(player.id)
      io.to(player.id).emit('reload', player, game, "ok");
    
    });
    await new Promise(r => setTimeout(r, 500));
  } 
})

//todo + kártyára nem + kártyakor nem adja a lpot
//todo +4 után 2-re lehet stackelni 

socket.on("usecard", (card,gameid) =>{
  console.log("KÁRTYA HASZNÁLVA")
  if(!Object.keys(games).includes(gameid)) {
    return;
  }
  let game = games[gameid];

  if(card[0] != game.currentcard[0] && card[1] != game.currentcard[1] && card != "aa") {return}

  if(game.players[game.currentplayer].cards.length == 1){
    console.log(JSON.stringify(game))
    game.currentcard = card;
    let cardindex = game.players[socket.nickname].cards.indexOf(card)
    game.players[socket.nickname].cards.splice(cardindex,1)
  
    io.in(game.room).emit('win', game.currentplayer, game.currentcard);
    rooms[game.room].status = "waiting"
    delete games[gameid]
    return
  }

  console.log(gameid)
  console.log(card,card[0],card[1])
  if(games[gameid]){
  console.log(game.currentcard)
  if(socket.nickname == game.currentplayer){
    if( card[0] == game.currentcard[0] || card[0] == "a" || card[1] == game.currentcard[1] || card[1] == "a" ){

      if(card[1] == "a"){
        game.currentcard = card;
        let cardindex = game.players[socket.nickname].cards.indexOf(card)
        game.players[socket.nickname].cards.splice(cardindex,1)
        const status = "selecting"
        games[gameid].status = "selecting"
  
        Object.values(games[gameid].players).forEach(player => {
          // console.log(player)
          console.log("----------------")
        let game = {currentcard: games[gameid].currentcard, currentplayer: games[gameid].currentplayer, pendingcards: games[gameid].pendingcard, order: games[gameid].order, next: games[gameid].order[games[gameid].order.indexOf(games[gameid].currentcard) + 1] ? games[gameid].order[games[gameid].order.indexOf(games[gameid].currentcard) + 1] : games[gameid].order[0] };
          game.opponents = {}
          Object.values(games[gameid].players).forEach(opponent => {
            if(opponent.name == player.name) {
              return;
            }
            game.opponents[opponent.name] = {name: opponent.name, cards: opponent.cards.length};
            console.log(game.opponents[opponent.name]);
          });
          console.log(player)
          console.log("----------------")
          console.log(player.id)
          console.log(games[gameid].currentplayer)
          io.to(player.id).emit('reload', player, game,status);
          console.log(player.name)
          if(player.name == games[gameid].currentplayer){
            console.log("asd")
          io.to(player.id).emit('selectcolor');
          }
        });

        return

      }

      else if(card[1] == "k"){
        let game = games[gameid];
        game.currentcard = card;
        let cardindex = game.players[socket.nickname].cards.indexOf(card)
        game.players[socket.nickname].cards.splice(cardindex,1)
        games[gameid].status = "ok"

        const status = "ok"

  
      let currentplayer = game.order.indexOf(socket.nickname);
/*      if(game.players[currentplayer].cards.length == 0){
        io.in(currentplayer.room).emit('win', currentplayer.name);
      
      }*/
      if(!(game.order[currentplayer+1])){
        game.currentplayer = game.order[0]
      } else {
        game.currentplayer = game.order[currentplayer+1]
      }

      console.log(`\n\n\n\n\n\n\n\n\n\n\n\n\n ${game.players[game.currentplayer].cards} \n\n\n\n\n\n\n\n\n\n\n\n\n`)

      if(game.players[game.currentplayer].cards.filter(card =>  card[1] == "a" || card[1] == `k`).length > 0){
        game.pendingcard += 2;
      } else {
        game.pendingcard += 2;
        game.players[game.currentplayer].cards.push(...cardgen(game.pendingcard));
        game.pendingcard = 0;
      }

      Object.values(games[gameid].players).forEach(player => {
        // console.log(player)
        console.log("----------------")
      let game = {currentcard: games[gameid].currentcard, currentplayer: games[gameid].currentplayer, pendingcards: games[gameid].pendingcard, order: games[gameid].order, next: games[gameid].order[games[gameid].order.indexOf(games[gameid].currentcard) + 1] ? games[gameid].order[games[gameid].order.indexOf(games[gameid].currentcard) + 1] : games[gameid].order[0] };
        game.opponents = {}
        Object.values(games[gameid].players).forEach(opponent => {
          if(opponent.name == player.name) {
            return;
          }
          game.opponents[opponent.name] = {name: opponent.name, cards: opponent.cards.length};
          console.log(game.opponents[opponent.name]);
        });
        console.log(player)
        console.log("----------------")
        console.log(player.id)
        io.to(player.id).emit('reload', player, game, status);

        if(game.currentplayer == player.name) {
          io.to(player.id).emit("round")
        }

      });

      return;
      }

      else if(card[1] == "r"){
        let game = games[gameid];
        game.currentcard = card;
        let cardindex = game.players[socket.nickname].cards.indexOf(card)
        game.players[socket.nickname].cards.splice(cardindex,1)
        games[gameid].status = "ok"

        const status = "ok"

        game.order = game.order.reverse()


  
      let currentplayer = game.order.indexOf(socket.nickname);
/*      if(game.players[currentplayer].cards.length == 0){
        io.in(currentplayer.room).emit('win', currentplayer.name);
      
      }*/
      if(!(game.order[currentplayer+1])){
        game.currentplayer = game.order[0]
      } else {
        game.currentplayer = game.order[currentplayer+1]
      }

      Object.values(games[gameid].players).forEach(player => {
        // console.log(player)
        console.log("----------------")
      let game = {currentcard: games[gameid].currentcard, currentplayer: games[gameid].currentplayer, pendingcards: games[gameid].pendingcard, order: games[gameid].order, next: games[gameid].order[games[gameid].order.indexOf(games[gameid].currentcard) + 1] ? games[gameid].order[games[gameid].order.indexOf(games[gameid].currentcard) + 1] : games[gameid].order[0] };
        game.opponents = {}
        Object.values(games[gameid].players).forEach(opponent => {
          if(opponent.name == player.name) {
            return;
          }
          game.opponents[opponent.name] = {name: opponent.name, cards: opponent.cards.length};
          console.log(game.opponents[opponent.name]);
        });
        console.log(player)
        console.log("----------------")
        console.log(player.id)
        io.to(player.id).emit('reload', player, game, status);

        if(game.currentplayer == player.name) {
          io.to(player.id).emit("round")
        }

      });

      return;
      }

      else if(card[1] == "b"){
        let game = games[gameid];
        game.currentcard = card;
        let cardindex = game.players[socket.nickname].cards.indexOf(card)
        game.players[socket.nickname].cards.splice(cardindex,1)
        games[gameid].status = "ok"

        const status = "ok"
        
        console.log(game.order)

      let currentplayer = game.order.indexOf(socket.nickname);
/*      if(game.players[currentplayer].cards.length == 0){
        io.in(currentplayer.room).emit('win', currentplayer.name);
      
      }*/
      if((game.order[currentplayer+2])){
        game.currentplayer = game.order[currentplayer+2]
      }
      else if((game.order[currentplayer+1])) {
        game.currentplayer = game.order[0]
      }
      else if(!(game.order[currentplayer+1])) {
        game.currentplayer = game.order[1]
      }

      Object.values(games[gameid].players).forEach(player => {
        // console.log(player)
        console.log("----------------")
      let game = {currentcard: games[gameid].currentcard, currentplayer: games[gameid].currentplayer, pendingcards: games[gameid].pendingcard, order: games[gameid].order, next: games[gameid].order[games[gameid].order.indexOf(games[gameid].currentcard) + 1] ? games[gameid].order[games[gameid].order.indexOf(games[gameid].currentcard) + 1] : games[gameid].order[0] };
        game.opponents = {}
        Object.values(games[gameid].players).forEach(opponent => {
          if(opponent.name == player.name) {
            return;
          }
          game.opponents[opponent.name] = {name: opponent.name, cards: opponent.cards.length};
          console.log(game.opponents[opponent.name]);
        });
        console.log(player)
        console.log("----------------")
        console.log(player.id)
        io.to(player.id).emit('reload', player, game, status);
        if(game.currentplayer == player.name) {
          io.to(player.id).emit("round")
        } 


      });

      return;
      }

      else{
        let game = games[gameid];
        game.currentcard = card;
        let cardindex = game.players[socket.nickname].cards.indexOf(card)
        game.players[socket.nickname].cards.splice(cardindex,1)
        games[gameid].status = "ok"

        const status = "ok"


  
      let currentplayer = game.order.indexOf(socket.nickname);
/*      if(game.players[currentplayer].cards.length == 0){
        io.in(currentplayer.room).emit('win', currentplayer.name);
      
      }*/
      if(!(game.order[currentplayer+1])){
        game.currentplayer = game.order[0]
      } else {
        game.currentplayer = game.order[currentplayer+1]
      }

      Object.values(games[gameid].players).forEach(player => {
        // console.log(player)
        console.log("----------------")
      let game = {currentcard: games[gameid].currentcard, currentplayer: games[gameid].currentplayer, pendingcards: games[gameid].pendingcard, order: games[gameid].order, next: games[gameid].order[games[gameid].order.indexOf(games[gameid].currentcard) + 1] ? games[gameid].order[games[gameid].order.indexOf(games[gameid].currentcard) + 1] : games[gameid].order[0] };
        game.opponents = {}
        Object.values(games[gameid].players).forEach(opponent => {
          if(opponent.name == player.name) {
            return;
          }
          game.opponents[opponent.name] = {name: opponent.name, cards: opponent.cards.length};
          console.log(game.opponents[opponent.name]);
        });
        console.log(player)
        console.log("----------------")
        console.log(player.id)
        io.to(player.id).emit('reload', player, game, status);

        if(game.currentplayer == player.name) {
          io.to(player.id).emit("round")
        }
      });

      return;
      }

    }
  }
}

console.log(game)




})

socket.on("colorselected", (color, gameid) => {
  console.log(`COLOR SELECTED: ${gameid}`)
  if(games[gameid].status != "selecting") {return}
  games[gameid].status = "ok"
  
  let game = games[gameid];
  game.currentcard = color + "a";

let currentplayer = game.order.indexOf(socket.nickname);
  if(!(game.order[currentplayer+1])){
    game.currentplayer = game.order[0]
  } else {
    game.currentplayer = game.order[currentplayer+1]
  }

  console.log(game)
  console.log(game.players)
  console.log(game.players[game.currentplayer])

  if(game.players[game.currentplayer].cards.filter(card =>  card[1] == "a" || card == `${color}k`).length > 0){
    game.pendingcard += 4;
  } else {
    game.pendingcard += 4;
    game.players[game.currentplayer].cards.push(...cardgen(game.pendingcard));
    game.pendingcard = 0;
  }

  console.log(game.players[game.currentplayer])

  const status = "ok"

  Object.values(games[gameid].players).forEach(player => {
    // console.log(player)
    console.log("----------------")
  let game = {currentcard: games[gameid].currentcard, currentplayer: games[gameid].currentplayer, pendingcards: games[gameid].pendingcard, order: games[gameid].order, next: games[gameid].order[games[gameid].order.indexOf(games[gameid].currentcard) + 1] ? games[gameid].order[games[gameid].order.indexOf(games[gameid].currentcard) + 1] : games[gameid].order[0] };
    game.opponents = {}


    Object.values(games[gameid].players).forEach(opponent => {
      if(opponent.name == player.name) {
        return;
      }
      game.opponents[opponent.name] = {name: opponent.name, cards: opponent.cards.length};
      console.log(game.opponents[opponent.name]);
    });

    console.log(game.opponents);

    console.log(player)
    console.log("----------------")
    console.log(player.id)
    console.log(games[gameid].currentplayer)
    io.to(player.id).emit('reload', player, game,status);
    console.log(player.name)
  });

  return;

})

  // Ha a kliens bezárja az oldalt
  socket.on('disconnect', function() {
    console.log('A user disconnected: ' + socket.id , socket.nickname);
    console.log(socket.room)

    console.log(Object.keys(games).filter(i => games[i].room === socket.room))

    let room = socket.room

  delete users[socket.nickname]

    setTimeout(() => {

      console.log("tiemout")


      //if(Object.values(users).includes(socket.nickname) && users[socket.nickname].path.includes(`room/${room}`) ) {
      

      if(!JSON.stringify(Object.values(users)).includes(socket.nickname) ) {

        console.log(`keres: ${JSON.stringify(Object.values(users))}`)

      // kilépteti a szóbából ha volt
      if(socket.room && socket.roomm != ""){
        if(rooms[socket.room]){
          const index = Object.keys(rooms[socket.room].players).map(object => object).indexOf(socket.nickname);
          console.log(index)
          
          delete rooms[socket.room].players[socket.nickname]
          console.log(`player lista refresh: ${rooms[socket.room].players}`)
          io.in(socket.room).emit('playerlist', Object.keys(rooms[socket.room].players));
          io.in("lobby").emit('reloadRoom', rooms[socket.room])

        }
      }

      } 
      //console.log(`kereső: ${users[socket.nickname].path} |||| ${room}`)
  if(!Object.keys(users).includes(socket.nickname) || !users[socket.nickname].path.includes(`room/${room}` )) {

    if(rooms[room] != null && Object.keys(rooms[room].players).includes(socket.nickname)) {
      delete rooms[room].players[socket.nickname]
      io.in("lobby").emit('reloadRoom', rooms[socket.room])
      io.in(rname).emit('playerlist', Object.keys(rooms[rname].players));

    }


    console.log("EZ KELL")
        console.log(Object.entries(rooms).filter(szoba => szoba[1].owner == socket.nickname ))
        if(Object.entries(rooms).filter(szoba => szoba[1].owner == socket.nickname).length > 0) {
          console.log("EZ IS KELL")
                   let owned = Object.entries(rooms).filter(szoba => szoba[1].owner == socket.nickname )
                   owned.forEach(element => {
                     let players = []
                     Object.values(element[1].players).forEach(player => { 
                       players.push(player.Name)
                     })
                     console.log(`sokadik szar: ${players}`)
                     if(!players.includes(element[1].owner)){
                      console.log("EZ IS KELL MÉG")

                       Object.values(element[1].players).forEach(player => { 
                       io.to(player.id).emit("quit");
                       })
                       delete rooms[element[0]]
                       delete games[ Object.keys(games).find(key => games[key].room === socket.room)               ]
                       Object.values(element[1].players).forEach(player => { 
                         io.to(player.id).emit("quit");
                       })
       
                       io.in("lobby").emit('roomList', Object.keys(rooms));
                     }
       
        
                   })
       
                 }
       
                 else if(room != null && (Object.keys(games).filter(i => games[i].room === room)) != null) {
                       
                   console.log("\n\n\n\n socket kilépett")
                   
                   let game = games[ Object.keys(games).find(key => games[key].room === socket.room)]
       
                   if(game == null) return
       
                   delete games[game.id].players[socket.nickname]
       
                   let currentplayer = game.order.indexOf(socket.nickname);
                   if(!(game.order[currentplayer+1])){
                     game.currentplayer = game.order[0]
                   } else {
                     game.currentplayer = game.order[currentplayer+1]
                   }
       
                   var index = games[game.id].order.indexOf(socket.nickname);
                   if (index !== -1) {
                     games[game.id].order.splice(index, 1);
                   }
       
       
       
                   Object.values(game.players).forEach(player => {
                     let gameid = game.id;
       
                     let gamedata = {currentcard: games[gameid].currentcard, currentplayer: games[gameid].currentplayer, pendingcards: games[gameid].pendingcard, order: games[gameid].order, next: games[gameid].order[games[gameid].order.indexOf(games[gameid].currentcard) + 1] ? games[gameid].order[games[gameid].order.indexOf(games[gameid].currentcard) + 1] : games[gameid].order[0] };
             game.opponents = {}
             Object.values(games[gameid].players).forEach(opponent => {
               if(opponent.name == player.name) {
                 return;
               }
               game.opponents[opponent.name] = {name: opponent.name, cards: opponent.cards.length};
               console.log(game.opponents[opponent.name]);
             });
       
                    io.to(player.id).emit("reload",player, gamedata, "ok" )
      io.in(rname).emit('playerlist', Object.keys(rooms[rname].players));
      console.log(`player lista refresh2: ${Object.keys(rooms[rname].players)}`)

                   })
       }
      }
      




}, 3000);

  });
});

app.post("/createroom", (req,res) => {
  if(nicknamecheck(req,res)){
    let roomName = req.body.roomName;
    if(!rooms[roomName]){
    rooms[roomName] = {name: roomName ,owner: nickname };
    rooms[roomName].players = {};
    rooms[roomName].players[nickname] = {};
    rooms[roomName].players[nickname] = {Name: nickname, id: ""};
    rooms[roomName].status = "waiting";
    // Belépés a szobába
    // rooms[roomName].players.push(nickname);
    // Updateli mindenkinek a listát
  }
  
  res.redirect(`/room/${roomName}`)
  
  io.in('lobby').emit('roomList', rooms);
  }
})

let port = 5556

server.listen(port, function() {
  console.log(`Listening on http://localhost:${port}`);
});

