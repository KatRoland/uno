const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const cookieParser = require('cookie-parser')
var cookie = require("cookie")
const {cardgen, startgen} = require("./cards")

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: 'false' }))
app.use(express.json())
app.use(cookieParser());

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

let users = [];

setInterval(() => {
  console.log("----------")
  console.log("szobák:" + rooms)
  console.log("----------")
  console.log("gamek:" +games)
  console.log("----------")
  console.log("playerek:" + users)
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
  var cookies = cookie.parse(socket.handshake.headers.cookie);
  if(cookies.username){
    socket.nickname = cookies.username
    users.push(socket.nickname)
    console.log('A user connected, uname: ' + socket.nickname);
  }
  console.log(io.sockets.adapter.rooms)
  console.log("-.-.--.--.-.-.-.-.-")
  console.log(io.sockets.connected)

    // Lobbyba lépés
  socket.join('lobby');

  // Kiküldi a jelenleg lévő szobákat
  socket.emit('roomList', Object.keys(rooms));

  // Szoba létrehozáskor

  // Szobába lépéskor
  socket.on('joinRoom', () => {
    // vizsgálat
// rooms[rname].players
      if(rooms[rname] && !(Object.keys(rooms[rname].players).includes(socket.nickname))){
        console.log(socket.id)
      // Belépés a szobába
      socket.join(rname);
      rooms[rname].players[socket.nickname] = {Name: socket.nickname, id: socket.id}
      socket.room = rname
      
      // Kilépés a lobbyból
      socket.leave("lobby")
      let roomgame
      if(rooms[socket.room].status == "started"){
        for(let gamename in games){
          let game = games[gamename]
          console.log(game)
          let player = Object.values(games[gamename].players).filter(player => player.name === socket.nickname)
          if(game.room == socket.room){
            roomgame = {personaldata: {playerinfo: player[0], gameid: gamename},currentcard: game.currentcard, currentplayer: game.currentplayer};
            roomgame.opponents = {};
            
            console.log("é.é.é.é.")
            console.log(player)
            player = player[0]
            Object.values(games[gamename].players).forEach(opponent => {
              console.log(opponent.name == player.name, opponent.name, player.name)
              if(opponent.name == player.name) {
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
              roomgame = {personaldata: {playerinfo: player[0], gameid: gamename},currentcard: game.currentcard, currentplayer: game.currentplayer};
              roomgame.opponents = {};

              Object.values(games[gameid].players).forEach(opponent => {
                if(opponent.name == player.name) {
                  return;
                }
                roomgame.opponents[opponent.name] = {name: opponent.name, cards: opponent.cards.length};
                console.log(game.opponents[opponent.name]);
              });

              break;
            }
          }
        } else {
          roomgame = "N/A"
        }
        socket.emit('roomload', rooms[socket.room], socket.room, roomgame);


        socket.emit('roomload', rooms[socket.room], socket.room,roomgame);
        io.in(rname).emit('playerlist', Object.keys(rooms[rname].players));
      }
      else{
        socket.emit('joinError')
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
  Object.values(rooms[rname].players).forEach(player => {
    console.log(player);
    games[gameid].players[player.Name] = {id: player.id ,name: player.Name, cards: cardgen(5)};
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
    let game = {currentcard: games[gameid].currentcard, currentplayer: games[gameid].currentplayer};
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

//?game loop

//kártya használás

//!nyerés figyelés --||--

socket.on("drawcard", async (gameid) => {

  console.log(gameid)

  let game = games[gameid]

  console.log(game.players[game.currentplayer].cards.filter(card =>  card[1] == "a" || card[0] == game.currentcard[0] || card[1] == game.currentcard[1]))

  while(game.players[game.currentplayer].cards.filter(card =>  card[1] == "a" || card[0] == game.currentcard[0] || card[1] == game.currentcard[1]).length == 0) {
    game.players[game.currentplayer].cards.push(...cardgen(1));

    Object.values(games[gameid].players).forEach(player => {
      // console.log(player)
      console.log("----------------")
      let game = {currentcard: games[gameid].currentcard, currentplayer: games[gameid].currentplayer};
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
      io.to(player.id).emit('reload', player, game, "ok");
    
    });
    await new Promise(r => setTimeout(r, 500));
  } 
})

socket.on("usecard", (card,gameid) =>{
  let game = games[gameid];
  console.log(gameid)
  console.log(card,card[0],card[1])
  if(games[gameid]){
  console.log(game.currentcard)
  if(socket.nickname == game.currentplayer){
    if( card[0] == game.currentcard[0] || card[0] == "a" || card[1] == game.currentcard[1] || card[1] == "a" ){

      if(game.pendingcard > 0){
        if(!(card[0] == game.currentcard[0] && card [1] == "k") || !card[1] == "a"){
          game.players[game.currentplayer].cards.push(...cardgen(game.pendingcard));
          game.pendingcard = 0;
        }
      }

      if(card[1] == "a"){
        game.currentcard = card;
        let cardindex = game.players[socket.nickname].cards.indexOf(card)
        game.players[socket.nickname].cards.splice(cardindex,1)
        const status = "selecting"
  
        Object.values(games[gameid].players).forEach(player => {
          // console.log(player)
          console.log("----------------")
          let game = {currentcard: games[gameid].currentcard, currentplayer: games[gameid].currentplayer};
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

        socket.on("colorselected", (color, gameid) => {
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
            let game = {currentcard: games[gameid].currentcard, currentplayer: games[gameid].currentplayer};
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

      }

      else if(card[1] == "k"){
        let game = games[gameid];
        game.currentcard = card;
        let cardindex = game.players[socket.nickname].cards.indexOf(card)
        game.players[socket.nickname].cards.splice(cardindex,1)
        const status = "ok"
  
      let currentplayer = game.order.indexOf(socket.nickname);
      if(!(game.order[currentplayer+1])){
        game.currentplayer = game.order[0]
      } else {
        game.currentplayer = game.order[currentplayer+1]
      }

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
        let game = {currentcard: games[gameid].currentcard, currentplayer: games[gameid].currentplayer};
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
      });

      return;
      }

      else if(card[1] == "r"){
        let game = games[gameid];
        game.currentcard = card;
        let cardindex = game.players[socket.nickname].cards.indexOf(card)
        game.players[socket.nickname].cards.splice(cardindex,1)
        const status = "ok"

        game.order = game.order.reverse()
  
      let currentplayer = game.order.indexOf(socket.nickname);
      if(!(game.order[currentplayer+1])){
        game.currentplayer = game.order[0]
      } else {
        game.currentplayer = game.order[currentplayer+1]
      }

      Object.values(games[gameid].players).forEach(player => {
        // console.log(player)
        console.log("----------------")
        let game = {currentcard: games[gameid].currentcard, currentplayer: games[gameid].currentplayer};
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
      });

      return;
      }

      else if(card[1] == "b"){
        let game = games[gameid];
        game.currentcard = card;
        let cardindex = game.players[socket.nickname].cards.indexOf(card)
        game.players[socket.nickname].cards.splice(cardindex,1)
        const status = "ok"
        
        console.log(game.order)

      let currentplayer = game.order.indexOf(socket.nickname);
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
        let game = {currentcard: games[gameid].currentcard, currentplayer: games[gameid].currentplayer};
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
      });

      return;
      }

      else{
        let game = games[gameid];
        game.currentcard = card;
        let cardindex = game.players[socket.nickname].cards.indexOf(card)
        game.players[socket.nickname].cards.splice(cardindex,1)
        const status = "ok"
  
      let currentplayer = game.order.indexOf(socket.nickname);
      if(!(game.order[currentplayer+1])){
        game.currentplayer = game.order[0]
      } else {
        game.currentplayer = game.order[currentplayer+1]
      }

      Object.values(games[gameid].players).forEach(player => {
        // console.log(player)
        console.log("----------------")
        let game = {currentcard: games[gameid].currentcard, currentplayer: games[gameid].currentplayer};
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
      });

      return;
      }
      
      // game.currentcard = card;
      // let cardindex = game.players[socket.nickname].cards.indexOf(card)
      // game.players[socket.nickname].cards.splice(cardindex,1)
      // let nextplayer;

      // let currentplayer = game.order.indexOf(socket.nickname);
      // if(!(game.order[currentplayer+1])){
      //   game.currentplayer = game.order[0]
      // } else {
      //   game.currentplayer = game.order[currentplayer+1]
      // }

      // Object.values(games[gameid].players).forEach(player => {
      //   // console.log(player)
      //   console.log("----------------")
      //   let game = {currentcard: games[gameid].currentcard, currentplayer: games[gameid].currentplayer};
      //   console.log(player)
      //   console.log("----------------")
      //   console.log(player.id)
      //   io.to(player.id).emit('reload', player, game);
      // });
    


    }
  }
}
})

  // Ha a kliens bezárja az oldalt
  socket.on('disconnect', function() {
    console.log('A user disconnected: ' + socket.id , socket.nickname);
    console.log(socket.room)

    const user = users.indexOf(socket.nickname);
      
      // kilépteti a szóbából ha volt
      if(socket.room && socket.roomm != ""){
        if(rooms[socket.room]){
          const index = Object.keys(rooms[socket.room].players).map(object => object).indexOf(socket.nickname);
          console.log(index)
          
          delete rooms[socket.room].players[socket.nickname]
          console.log(rooms[socket.room].players)
          io.in(socket.room).emit('playerlist', Object.keys(rooms[socket.room].players));
        }
      }

      users.splice(user,1)
      console.log(users)

setTimeout(() => {
  console.log(Object.entries(rooms).filter(szoba => szoba[1].owner == socket.nickname ))
 if(Object.entries(rooms).filter(szoba => szoba[1].owner == socket.nickname).length > 0) {
            let owned = Object.entries(rooms).filter(szoba => szoba[1].owner == socket.nickname )
            owned.forEach(element => {
              let players = []
              Object.values(element[1].players).forEach(player => { 
                players.push(player.Name)
              })
              if(!players.includes(element[1].owner)){
                Object.values(element[1].players).forEach(player => { 
                io.to(player.id).emit("quit");
                })
                delete rooms[element[0]]
                Object.values(element[1].players).forEach(player => { 
                  io.to(player.id).emit("quit");
                })
                io.in("lobby").emit('roomList', Object.keys(rooms));
              }
            })

          }
}, 3000);

  });
});

app.post("/createroom", (req,res) => {
  if(nicknamecheck(req,res)){
    let roomName = req.body.roomName;
    if(!rooms[roomName]){
    rooms[roomName] = { owner: nickname };
    rooms[roomName].players = {};
    rooms[roomName].players[nickname] = {};
    rooms[roomName].players[nickname] = {Name: nickname, id: ""};
    rooms[roomName].status = "waiting";
    // Belépés a szobába
    // rooms[roomName].players.push(nickname);
    // Updateli mindenkinek a listát
    io.in('lobby').emit('roomList', Object.keys(rooms));
  }

    res.redirect(`/room/${roomName}`)

  }
})

server.listen(3000, function() {
  console.log('Listening on http://localhost:3000');
});
