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
var multiplierValue = [49, 14, 5.3, 2.1, 0.5, 0.2, 0.0, 0.2, 0.5, 2.1, 5.3, 14, 49];
/*var probabilities = [0.00129327, 0.00129327, 0.02884998, 0.06565858, 0.14723438,
    0.15718265, 0.19697573, 0.15718265, 0.14723438, 0.06565858,
    0.02884998, 0.00129327, 0.00129327]; //95.46%
*/
var probabilities = [0.0005, 0.0005, 0.015, 0.0325, 0.075,
    0.08, 0.593, 0.08, 0.075, 0.0325,
    0.015, 0.0005, 0.0005]; //88.15%



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
        gameName: "Plinko",
        minBet: 1,
        maxBet: 1024,
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
                currencyInfo: currencyInfo,
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
        betOdds: multiplierValue,
        minBet: 1,
        maxBet: 1024,
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

function setBetRequest(bet) {
    awardBase = bet;
    gameCode = "#" + generateRandomString(10);
    balance -= awardBase;

    var cumulativeProbabilities = probabilities.reduce((acc, curr, i) => {
        if (i === 0) acc.push(curr);
        else acc.push(acc[i - 1] + curr);
        return acc;
    }, []);

    var randomNumber = Math.random();
    var selectedMultiplierIndex = cumulativeProbabilities.findIndex(cumProb => randomNumber < cumProb);

    let winAmount = multiplierValue[selectedMultiplierIndex - 1] * bet;

    let response = {
        errCode: 0,
        errMsg: "success",
        vals: {},
    }

    betInfo = [{
        bet: awardBase,
        balance: balance,
        index: selectedMultiplierIndex,
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
                    //original
                    //let response = setBetRequest(bet);
                    //ws.send(JSON.stringify(response));
                    // new
                    let size = jsonContent.data[0].subData[0].message.size;
                    for (let i = 0; i < size; i++) {
                        let response = setBetRequest(bet);
                        ws.send(JSON.stringify(response));
                    }
                }
            }
        }
    })

    function randomBetResult(bet) {
        var multiplierValue = [49, 14, 5.3, 2.1, 0.5, 0.2, 0.0, 0.2, 0.5, 2.1, 5.3, 14, 49];
        // Probabilities corresponding to each multiplier
        var probabilities = [0.0035, 0.0035, 0.0355, 0.0709, 0.1418, 0.156, 0.1773, 0.156, 0.1418, 0.0709, 0.0355, 0.0035, 0.0035];

        // Calculate cumulative probabilities for interval mapping
        var cumulativeProbabilities = probabilities.reduce((acc, curr, i) => {
            if (i === 0) acc.push(curr);
            else acc.push(acc[i - 1] + curr);
            return acc;
        }, []);

        // Generate a random number between 0 and 1
        var randomNumber = Math.random();

        // Determine which interval the random number falls into
        var selectedMultiplierIndex = cumulativeProbabilities.findIndex(cumProb => randomNumber < cumProb);

        // Calculate the win amount based on the selected multiplier
        var winAmount = bet * multiplierValue[selectedMultiplierIndex];

        return {
            selectedMultiplier: multiplierValue[selectedMultiplierIndex],
            winAmount: winAmount
        };
    }

    function adjustProbabilities(currentRTP, targetRTP, probabilities) {
        // Simplified adjustment logic: if the actual RTP is higher than the target, decrease the probability of high multipliers, and vice versa
        if (currentRTP > targetRTP) {
            // Decrease the probability of the highest multiplier slightly
            probabilities[0] -= 0.001; // Example adjustment
            probabilities[probabilities.length - 1] -= 0.001;
        } else {
            // Increase the probability of the highest multiplier slightly
            probabilities[0] += 0.001;
            probabilities[probabilities.length - 1] += 0.001;
        }

        // Ensure the probabilities still sum to 1 after adjustment
        let sum = probabilities.reduce((acc, val) => acc + val, 0);
        probabilities = probabilities.map(prob => prob / sum);

        return probabilities;
    }


    function simulateBetWithDynamicRTP(bet, targetRTP) {
        // Your existing logic to select a multiplier based on current probabilities

        // Update total bets and total payouts
        totalBets += bet;
        // Assuming result is the outcome of the bet based on the current logic
        let result = randomBetResult(bet); // This function needs to be defined as before, using current probabilities
        totalPayouts += result.winAmount;

        // Calculate current RTP
        let currentRTP = totalPayouts / totalBets;

        // Adjust probabilities based on current RTP vs. target RTP
        let adjustedProbabilities = adjustProbabilities(currentRTP, targetRTP, probabilities); // probabilities should be defined globally or passed appropriately

        // Use the adjusted probabilities for future bets
        // This step would involve integrating the adjusted probabilities back into your bet selection logic
    }
});