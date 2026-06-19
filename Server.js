const express = require("express");
const GetRoomHash = require("./GetRoomHash");
const JoinRoom = require("./JoinRoom");

const app = express();
app.use(express.json());

/**
 * Get Room Hash
 */
app.get("/room-hash/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const roomHash = await GetRoomHash(code);

    res.json({
      success: true,
      roomCode: code,
      roomHash,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Join Room
 */
app.post("/join-room", async (req, res) => {
  try {
    const { roomHash, name } = req.body;

    if (!roomHash) {
      return res.status(400).json({
        success: false,
        error: "roomHash is required",
      });
    }

    const result = await JoinRoom({
      roomHash,
      name: name || "Bot",
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.listen(3000, () => {
  console.log("API running on port 3000");
});