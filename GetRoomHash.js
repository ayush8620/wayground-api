const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function GetRoomHash(roomCode) {
  const res = await fetch(
    "https://wayground.com/play-api/v5/checkRoom",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        roomCode
      })
    }
  );

  const data = await res.json();

  if (!data?.room?.hash) {
    throw new Error("Room hash not found");
  }

  return data.room.hash;
}

module.exports = GetRoomHash;