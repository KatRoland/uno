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
  console.log(rooms)
  console.log("----------")
  console.log(games)
  console.log("----------")
  console.log(users)
  console.log("----------")
}, 10000);

app.get("/room/:roomname", function(req,res) {
  if(req.cookies.username){
  const {roomname} = req.params;
  rname = roomname;
  nickname = req.cookies.username;
  res.render("room");
} else {
  res.render("username")
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

    // Lobbyba lépés
  socket.join('lobby');

  // Kiküldi a jelenleg lévő szobákat
  socket.emit('roomList', Object.keys(rooms));

  // Szoba létrehozáskor
  socket.on('createRoom', function(roomName) {
    rooms[roomName] = { owner: socket.nickname };
    rooms[roomName].players = [];
    rooms[roomName].status = "waiting";
    // Belépés a szobába
    socket.join(roomName);  
    rooms[roomName].players.push(socket.nickname);
    socket.room = roomName;
    // Updateli mindenkinek a listát
    io.in('lobby').emit('roomList', Object.keys(rooms));
  });




  // Szobába lépéskor
  socket.on('joinRoom', () => {
    // vizsgálat

      if(rooms[rname] && !(rooms[rname].players.includes(socket.nickname))){
        console.log(socket.id)
      // Belépés a szobába
      socket.join(rname);
      rooms[rname].players.push(socket.nickname)
      socket.room = rname
      
      // Kilépés a lobbyból
      socket.leave("lobby")
      let roomgame
      if(rooms[socket.room].status == "started"){
        for(let gamename in games){
          let game = games[gamename]
          console.log(game)
          if(game.room == socket.room){
            roomgame = game;
            break;
          }
        }
      } else {
        roomgame = "N/A"
      }
      socket.emit('roomload', rooms[socket.room], socket.room, roomgame);
      io.in(rname).emit('playerlist', rooms[rname].players);

      }else if(rooms[rname] && (rooms[rname].players.includes(socket.nickname) && !socket.room )){
        socket.join(rname);
        socket.room = rname
  
        // Kilépés a lobbyból
        socket.leave("lobby")
  
        socket.emit('roomload', rooms[socket.room], socket.room);
        io.in(rname).emit('playerlist', rooms[rname].players);
      }
      else{
        socket.emit('joinError')
      }

  });

socket.on('start', function () {
  if(rooms[socket.room].status == "waiting"){
  rooms[socket.room].status = "started"
  io.in(socket.room).emit('gamestarted');
  let gameid = Math.random().toString(36).substring(2)
  console.log(gameid)
  games[gameid] = {}
  games[gameid].room = socket.room
  games[gameid].players = {}
  rooms[socket.room].players.forEach(player => {
    games[gameid].players[player] = {name: player, cards: cardgen(5)}
  });

  games[gameid].currentcard = startgen();
    let game = games[gameid];
    console.log(game)
  io.in(socket.room).emit('gamestart', game); 

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
          const index = rooms[socket.room].players.map(object => object).indexOf(socket.nickname);
          console.log(index)
          
          rooms[socket.room].players.splice(index,1)
          io.in(socket.room).emit('playerlist', rooms[socket.room].players);
        }
      }

      users.splice(user,1)
      console.log(users)

setTimeout(() => {
  if(!users.includes(socket.nickname)){
    // Vizsgálat hogy volt-e szobája
        for (let roomName in rooms) {
          let room = rooms[roomName];
          if (room.owner === socket.nickname) {
    
            // törlés ha volt
            delete rooms[roomName];
    
            //kiszedi a szobát
            socket.room = ""
    
            // updateli a szoba listát
            io.in('lobby').emit('roomList', Object.keys(rooms));
          }
        }
          }
}, 3000);

  });
});

app.post("/createroom", (req,res) => {
  if(nicknamecheck(req,res)){
    let roomName = req.body.roomName;
    rooms[roomName] = { owner: nickname };
    rooms[roomName].players = [];
    rooms[roomName].status = "waiting";
    // Belépés a szobába
    rooms[roomName].players.push(nickname);
    // Updateli mindenkinek a listát
    io.in('lobby').emit('roomList', Object.keys(rooms));

    res.redirect(`/room/${roomName}`)

  }
})

server.listen(3000, function() {
  console.log('Listening on http://localhost:3000');
});
