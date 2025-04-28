const Websocket = require("ws");

const server = new Websocket.Server({ port: 9900 });

let wsocket; // Declare a variable to hold the WebSocket object

var balance = 0;
var playerId = "";
var increaseMoney = 0;
var gameCode = "";
var awardMoney = 0;
var awardBase = 0;
var gameType = 2;
var roomId = 0;
var records = [];


function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters.charAt(randomIndex);
    }

    return randomString;
}

function generateRandomInt(length) {
    const characters = '0123456789';
    let randomString = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters.charAt(randomIndex);
    }

    return randomString;
}


function loginRequest() {
    playerId = generateRandomString(8);
    balance = 200000;

    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    response.vals = {
        type: 1,
        id: 1,
        data: {
            sessionId: generateRandomInt(10),
            errCode: 0,
            lobbyServerIp: "127.0.0.1",
            lobbyServerPort: 9900,
            playerId: playerId,
        }
    }

    return response;
}

function lobbyRequest() {

    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    response.vals = {
        type: 3,
        id: 3,
        data: {
            gameId: generateRandomInt(6),
            errCode: 0,
            balance: balance,
            serverTime: Date.now(),
            currency: "CNY",
            walletType:2,
        }
    }
    return response;
}

function joinRoomRequest() {
    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    betInfo = {
        gameName: "LineDice",
        minBet: 1,
        maxBet: 1024,
        defaultBet:1,
    }

    currencyInfo = {
        currencyId: 1,
        currency: "CNY",
    }

    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100005,
            subData: [{
                gameType: gameType,
                roomId: roomId,
                errCode: 0,
                balance: balance,
                betInfo: [betInfo],
                currencyInfo: [currencyInfo],
            }]
        }
    }

    return response;
}

function transferRequest() {
    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100069,
            subData: [{
                errCode: 0,
                balance: balance,
                increaseMoney: increaseMoney,
            }]
        }
    }

    increaseMoney = 0;
    return response;
}

function recordRequest() {
    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    records = [
        {
            id: 321541,
            bet: 2,
            odds: 0.0,
            winMoney:0,
        },
        {
            id: 321541,
            bet: 2,
            odds: 1.5,
            winMoney: 3,
        },
    ]

    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100071,
            subData: [{
                errCode: 0,
                opCode: "GetRecords",
                recordsInfo: records,
            }]
        }
    }

    return response;
}

function roomInfoRequest() {
    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    roomInfo = {
        recordList: records,
    }

    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100071,
            subData: [{
                errCode: 0,
                opCode: "SyncRoomInfo",
                roomInfo: roomInfo,
            }]
        }
    }

    return response;
}

function roomListRequest() {
    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    let date = Date.now();
    date += 60 * 60 * 1000;
    response.vals = {
        type: 100000,
        id: 3,
        data: {
            gameType: gameType,
            roomIndex: roomId,
            isOccupied: true,
            reserveExpiredTime : date,
        }
    }

    return response;
}

function setBetRequest(bet, mode,  range, multiplier) {

    let validMultiplier = calculateMultiplier(mode, range);
    //console.log(validMultiplier, multiplier);
    if (validMultiplier != multiplier) {
        // bet failed
        let response = {
            errCode: 0,
            errMsg: "success",
            vals: {},
        }

        response.vals = {
            type: 100000,
            id: 3,
            data: {
                subType: 100071,
                subData: [{
                    errCode: 8100,
                    opCode: "SetBet",
                    betInfo: betInfo,
                }]
            }
        }

        return response;
    }

    awardBase = bet;
    gameCode = "#" + generateRandomString(10);
    balance -= awardBase;

    let randomValue = getRandomInclusive();

    // check random inclusive inside range
    let valid = isInRange(randomValue, range);

    if (!valid) {
        multiplier = 0;
    }

    let winAmount = multiplier * bet;

    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    betInfo = [{
        bet: awardBase,
        balance: balance,
        value: randomValue,
        multiplier: multiplier,
        winAmount: winAmount,
        roundId: gameCode,
        finalBalance: balance + winAmount,
    }]
    response.vals = {
        type: 100000,
        id: 3,
        data: {
            subType: 100071,
            subData: [{
                errCode: 0,
                opCode: "SetBet",
                betInfo: betInfo,
            }]
        }
    }

    balance += winAmount;

    return response;
}

function calculateMultiplier(mode, ranges) {
    function winChanceMode0([start, end]) {
        return +(end - start).toFixed(2);
    }

    function winChanceMode1([start, end]) {
        return Math.floor((end - start - 0.000001) * 100) / 100;
    }

    function winChanceMode2([start, end]) {
        return Math.floor((end - start - 0.000001) * 100) / 100;
    }

    function winChanceMode3([r1start, r1end], [r2start, r2end]) {
        const zone1 = +(r1end - r1start).toFixed(2);
        const zone2 = +(r2end - r2start).toFixed(2);
        return Math.floor((zone1 + zone2 - 0.000001) * 100) / 100;
    }

    function winChanceMode4([r1, r2]) {
        let z1 = +(r1[1] - r1[0]).toFixed(2);
        let z2 = +(r2[1] - r2[0]).toFixed(2);

        if (z1 < 0.01) z1 = 0;
        if (z2 < 0.01) z2 = 0;

        if (z1 > 0 && z2 > 0 && z1 <= 0.02 && z2 <= 0.02) return z1;
        return z1 + z2;
    }

    let winChance = 0;

    if (mode === 0) winChance = winChanceMode0(ranges[0]);
    else if (mode === 1) winChance = winChanceMode1(ranges[0]);
    else if (mode === 2) winChance = winChanceMode2(ranges[0]);
    else if (mode === 3) winChance = winChanceMode3(ranges[0], ranges[1]);
    else if (mode === 4) winChance = winChanceMode4(ranges);

    if (winChance <= 0) return 0;

    if (mode === 0) {
        return Math.round((99 / winChance + 0.00000001) * 10000) / 10000;
    }

    return Math.round((99 / winChance) * 10000) / 10000;
}

function getRandomInclusive() {
    return Math.floor(Math.random() * 10001) / 100;
}

function isInRange(value, ranges) {
    for (const [min, max] of ranges) {
        if (value >= min && value <= max) {
            return true;
        }
    }
    return false;
}


server.on("connection", (ws) => {
    wsocket = ws;

    // ws.send("4515ce54-c62a-43ed-964e-0f4d4dc402b3");

    ws.on("message", (message) => {
        const jsonContent = JSON.parse(message);

        // login request
        if (jsonContent.type == 0) {
            let response = loginRequest();
            ws.send(JSON.stringify(response));
        }

        // lobby request
        if (jsonContent.type == 2) {
            let response = lobbyRequest();
            ws.send(JSON.stringify(response));
        }

        // room list request
        if (jsonContent.type == 200017) {
            let response = roomListRequest();
            ws.send(JSON.stringify(response));
        }

        if (jsonContent.type == 100000) {
            // join Room request

            if (jsonContent.data[0].subType == 100004) {
                roomId = jsonContent.data[0].subData.roomId;
                let response = joinRoomRequest();
                ws.send(JSON.stringify(response));
            }

            // transfer info request
            if (jsonContent.data[0].subType == 100068) {
                let response = transferRequest();
                ws.send(JSON.stringify(response));
            }

            // custom request
            if (jsonContent.data[0].subType == 100070) {
                // get records request
                if (jsonContent.data[0].subData[0].opCode == "GetRecords") {
                    let response = recordRequest();
                    ws.send(JSON.stringify(response));
                }
                // sync room info request
                if (jsonContent.data[0].subData[0].opCode == "SyncRoomInfo") {
                    let response = roomInfoRequest();
                    ws.send(JSON.stringify(response));
                }
                // set bet request
                if (jsonContent.data[0].subData[0].opCode == "SetBet") {
                    let bet = jsonContent.data[0].subData[0].message.bet;
                    let mode = jsonContent.data[0].subData[0].message.mode;
                    let range = jsonContent.data[0].subData[0].message.range;
                    let multiplier = jsonContent.data[0].subData[0].message.multiplier;
                    let response = setBetRequest(bet, mode, range, multiplier);

                    if (response == -1) {

                    }
                    ws.send(JSON.stringify(response));
                }
            }
        }
    })
});