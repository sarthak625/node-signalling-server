const redis = require('../../db');

let connectedUsers = [];

exports.addToConnectedUsersList = (socketId, username) => {
    connectedUsers.push({ socketId, username, isInCall: false });
    return connectedUsers;
}

exports.getConnectedUsersList = () => {
    return connectedUsers.filter((user) => !user.isInCall);
}

exports.removeSocketFromConnectedUsers = (socketId) => {
    connectedUsers = connectedUsers.filter((user) => user.socketId !== socketId);
    return connectedUsers;
}

exports.createCallDocForUser = async (data, currentUserSocketId) => {
    const { userSocketId } = data;
    if (!userSocketId) {
        throw { customErr: 'User socket id needed to initiate a call' };
    }

    if (currentUserSocketId === userSocketId) {
        throw { customErr: 'User cannot initiate call with themselves' };
    }

    const key = `${currentUserSocketId}_${userSocketId}`;
    const isExistingKey = await redis.exists(key);
    if (isExistingKey) {
        await redis.del(key);
    }

    const callDoc = {
        id: key,
        isCallInitiated: false,
        caller: currentUserSocketId,
        callee: userSocketId,
    };

    await redis.set(key, JSON.stringify(callDoc), 'EX', 30 * 60 * 60);

    return callDoc;
}

exports.addOfferCandidateForCall = async (data) => {
    const { candidate, id } = data;
    const key = `${id}-offer-candidate`;
    const isExistingKey = await redis.exists(id);
    if (!isExistingKey) {
        throw { customErr: `Call doesn't exist, cannot create offer candidate` };
    }

    const candidateData = await redis.get(key);

    let allCandidates;
    if (!candidateData) {
        allCandidates = { candidates: [ candidate ] };
    } else {
        const doc = JSON.parse(candidateData);
        const { candidates } = doc;
        candidates.push(candidate);
        allCandidates = { candidates };
    }
    
    await redis.set(key, JSON.stringify(allCandidates), 'EX', 30 * 60 * 60);
    return candidate;
}

exports.addAnswerCandidateForCall = async (data) => {
    const { candidate, id } = data;
    const key = `${id}-answer-candidate`;
    const isExistingKey = await redis.exists(id);
    if (!isExistingKey) {
        throw { customErr: `Call doesn't exist, cannot create answer candidate` };
    }

    const candidateData = await redis.get(key);

    let allCandidates;
    if (!candidateData) {
        allCandidates = { candidates: [ candidate ] };
    } else {
        const doc = JSON.parse(candidateData);
        const { candidates } = doc;
        candidates.push(candidate);
        allCandidates = { candidates };
    }
    
    await redis.set(key, JSON.stringify(allCandidates), 'EX', 30 * 60 * 60);

    const callDoc = await redis.get(id);
    const callDocData = JSON.parse(callDoc);
    return {
        candidate,
        caller: callDocData.caller,
    };
}

exports.addOffer = async (data) => {
    const { offer, id } = data;
    const key = `${id}`;
    const isExistingKey = await redis.exists(id);
    if (!isExistingKey) {
        throw { customErr: `Call doesn't exist, cannot create offer` };
    }

    const offerData = await redis.get(key);
    const callDoc = JSON.parse(offerData);
    callDoc.offer = offer;
    await redis.set(key, JSON.stringify(callDoc), 'EX', 30 * 60 * 60);

    return callDoc;
}

exports.addAnswer = async (data) => {
    const { answer, id } = data;
    const key = `${id}`;
    const isExistingKey = await redis.exists(id);
    if (!isExistingKey) {
        throw { customErr: `Call doesn't exist, cannot create offer` };
    }

    const offerData = await redis.get(key);
    const callDoc = JSON.parse(offerData);
    callDoc.answer = answer;
    await redis.set(key, JSON.stringify(callDoc), 'EX', 30 * 60 * 60);

    return callDoc;
}