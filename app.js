const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjectToResponseObject1 = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertDbObjectToResponseObject2 = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertDbObjectToResponseObject3 = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

//API Request to get the details of all players
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT 
     *
    FROM 
    player_details
    ORDER BY 
    player_id`;

  const playerQuery = await database.all(getPlayersQuery);
  response.send(
    playerQuery.map((eachPlayer) =>
      convertDbObjectToResponseObject1(eachPlayer)
    )
  );
});

//API Request to get the single player details
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
     *
    FROM 
    player_details
    where  
    player_id=${playerId}`;

  const playerQuery = await database.get(getPlayerQuery);
  response.send(convertDbObjectToResponseObject1(playerQuery));
});

//API Request to update the player details of givenId
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE
    player_details
    SET
    player_name='${playerName}'
    where player_id=${playerId};`;

  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API Request to get all the match details of a specific match

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetails = `
    SELECT 
    * 
    FROM 
   match_details
    WHERE 
    match_id=${matchId};`;
  const matchQuery = await database.get(getMatchDetails);
  response.send(convertDbObjectToResponseObject2(matchQuery));
});

//API to get the list of all matches of a player

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;

  const getMatchesOfPlayer = `
    SELECT 
     * 
    FROM 
      player_match_score
    NATURAL JOIN 
      match_details
    WHERE 
      player_id=${playerId};`;

  const getMatchDetails = await database.all(getMatchesOfPlayer);
  response.send(
    getMatchDetails.map((eachMatch) =>
      convertDbObjectToResponseObject2(eachMatch)
    )
  );
});

// Api Request to return a list of players of a specific match

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getListOfPlayers = `
    SELECT 
     *
    FROM 
      player_details
    NATURAL JOIN 
      player_match_score
    WHERE 
      match_id=${matchId};`;

  const getPlayersOfMatch = await database.all(getListOfPlayers);
  response.send(
    getPlayersOfMatch.map((eachPlayer) =>
      convertDbObjectToResponseObject1(eachPlayer)
    )
  );
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getTotalScoreOfPlayer = `
    SELECT 
    player_id as playerId,
    player_name as playerName,
    SUM(score) as totalScore,
    SUM(fours) as totalFours,
    SUM(sixes) as totalSixes
    FROM player_match_score 
    NATURAL JOIN 
    player_details
    WHERE 
    player_id=${playerId};`;

  const getTotalScore = await database.get(getTotalScoreOfPlayer);
  response.send(getTotalScore);
});

module.exports = app;
