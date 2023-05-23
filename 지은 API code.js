var mysql = require('mysql');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json({extended: true})); //사용자가 웹사이트로 전달하는 정보들을 검사>하는 미들웨어
app.use(bodyParser.urlencoded({extended: true})); //json이 아닌 post형식으로올때 파서

// 서버 시작
app.listen(3000, function () {
    console.log('서버 실행 중...');
});

// MySQL 연결 설정
// var connection = mysql.createConnection({
//     host: "",
//     user: "",
//     database: "",
//     password: "",
//     port: 
// });

// 유저 대기 걸기
app.post('/user/waiting/insert', function(req, res) {
    var UserPhone = req.body.UserPhone;
    var resPhNum = req.body.resPhNum;
    var Waitheadcount = req.body.Waitheadcount;
    var WaitTime = req.body.WaitTime;
    var WaitSeat = req.body.WaitSeat;
    var WaitisAccepted = false;
    var sql1 = 'INSERT INTO Waiting (UserPhone, resPhNum, WaitHeadcount, WaitTime, WaitSeat, WaitisAccepted) VALUES(?, ?, ?, ?, ?, ?);';
    var params1 = [UserPhone, resPhNum, Waitheadcount, WaitTime, WaitSeat, WaitisAccepted];
    sql1 = mysql.format(sql1, params1);
    connection.query(sql1, function(err, results) {
        if(err) {
            console.log(err);
            res.json({
                'message' : '에러 발생'
            })
        } else {
            res.json({
                'UserPhone': UserPhone,
                'resPhNum': resPhNum,
                'Waitheadcount': Waitheadcount,
                'WaitTime': WaitTime,
                'WaitSeat': WaitSeat,
                'WaitisAccepted': WaitisAccepted,
                'message' : '등록 완료!'
            });
        };
    });
});

// 유저 대기 걸기2
// restaurants의 대기 시간에 따름
app.post('/user/waiting/insert_time', function(req, res) {
    var UserPhone = req.body.UserPhone;
    var resPhNum = req.body.resPhNum;
    var Waitheadcount = req.body.Waitheadcount;
    var WaitTime = req.body.WaitTime;
    var WaitSeat = req.body.WaitSeat;
    var WaitisAccepted = false;
    var sql1 = 'SELECT resWaitOpen, resWaitClose FROM Restaurants WHERE resPhNum = ?;';
    var sql2 = 'INSERT INTO Waiting (UserPhone, resPhNum, WaitHeadcount, WaitTime, WaitSeat, WaitisAccepted) VALUES(?, ?, ?, ?, ?, ?);';
    var params1 = [resPhNum];
    var params2 = [UserPhone, resPhNum, Waitheadcount, WaitTime, WaitSeat, WaitisAccepted];
    sql1 = mysql.format(sql1, params1);
    sql2 = mysql.format(sql2, params2);
    // 대기 가능 시간인 지 확인
    connection.query(sql1, function(err1, result1) {
        if(err1) {
            console.log(err1);
            res.json({
                'message' : '에러 발생1'
            });
        }
        var WTime = new Date(WaitTime).toTimeString().split(' ')[0];
        if (WTime < result1[0].resWaitOpen || WTime > result1[0].resWaitClose) {
            res.json({
                'message' : '대기 가능 시간 아님'
            });
            return;
        } else {
            // 대기 가능하다면, INSERT 쿼리 실행
            connection.query(sql2, function(err2, result2) {
                if(err2) {
                    console.log(err2);
                    res.json({
                        'message' : '에러 발생2'
                    });
                } else {
                    res.json({
                        'UserPhone': UserPhone,
                        'resPhNum': resPhNum,
                        'Waitheadcount': Waitheadcount,
                        'WaitTime': WaitTime,
                        'WaitSeat': WaitSeat,
                        'WaitisAccepted': WaitisAccepted,
                        'message' : '등록 완료!'
                    });
                }
            });
        }
    });
});

// 사용자 WaitIndex 반환
app.post('/user/waitindex', function(req, res) {
    var UserPhone = req.body.UserPhone;
    var WaitTime = req.body.WaitTime;
    var sql = 'SELECT WaitIndex FROM Waiting WHERE (UserPhone = ? AND WaitTime = ?)';
    var params = [UserPhone, WaitTime];
    connection.query(sql, params, function (err, result) {
        if (err) {
            console.log(err);
            return;
        } 
        res.json({
            result
        });
    });
});

// 과거 대기 내역
// 아이디, 레스토랑 이름, 레스토랑 사진, 대기일자
app.post('/user/waited', function(req, res) {
    var UserPhone = req.body.UserPhone;
    
    var sql1 = 'SELECT UserPhone, resPhNum, acceptedTime, resName, resImg, resIdx, WaitisAccepted From (SELECT * FROM Waited NATURAL JOIN Restaurants) Waited WHERE UserPhone = ? AND WaitisAccepted >= 2;';
    var params1 =[UserPhone];
    sql1 = mysql.format(sql1, params1);
    connection.query(sql1, function (err1, result1) {
        if (err1) {
            console.log(err1);
            return;
        }
        res.json({
            result1
        }) 
    });
});

//과거 대기 손님 리스트
app.post('/kiosk/waited', function(req, res) {
    var resPhNum = req.body.resPhNum;

    var sql = 'SELECT * From Waited WHERE resPhNuM = ? AND WaitisAccepted = 2;';
    var params = [resPhNum];

    connection.query(sql, params, function (err, result) {
        if (err) {
            console.log(err);
            return;
        } 

        res.json({
            result
        });
    });
});

//대기자 명단 확인
app.post('/kiosk/waitinginfo', function(req, res) {
    var resPhNum = req.body.resPhNum;

    var sql = 'SELECT WaitIndex, UserPhone, WaitHeadcount, WaitSeat, WaitisAccepted FROM (SELECT * FROM Waiting NATURAL JOIN Restaurants) Waiting WHERE resPhNum = ?;';
    var params = [resPhNum];

    connection.query(sql, params, function (err, result) {
        if (err) {
            console.log(err);
            return;
        } 

        res.json({
            result
        });
    });
});

// 대기 내역 삭제
app.post('/user/waiting/delete', function(req, res) {
    var WaitIndex = req.body.WaitIndex;
    var params = [WaitIndex];

    var sql = 'DELETE FROM Waiting WHERE WaitIndex = ?';

    connection.query(sql, params, function (err, result) {
        var resultCode = 404;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            message = '대기 신청이 취소되었습니다.';
        }

        res.json({
            'code': resultCode,
            'WaitIndex' : WaitIndex,
            'message' : message
        });
    });
});

// 내 앞 대기자 수 확인
// 해당 음식점, 본인 앞에 있는 대기자만 가져옴
// result.length를 구해서 앞에 몇 명이 있는 지 파악
app.post('/user/waiting/waitingnumber', function(req, res) {
    console.log(req.body);
    var WaitIndex = req.body.WaitIndex;
    var resPhNum = req.body.resPhNum;
    var sql = 'SELECT * FROM Waiting WHERE (waitIndex < ? AND resPhNum = ? AND WaitIsAccepted = 0)';
    //var sql = 'SELECT * FROM (SELECT * FROM Waiting WHERE (resPhNum = ? AND WaitisAccepted = FALSE) ORDER BY WaitTime) Waiting WHERE WaitTime < (SELECT WaitTime FROM Waiting WHERE UserPhone = ? )';
    var params = [WaitIndex, resPhNum];
    connection.query(sql, params, function (err, result) {
        var message = '에러가 발생했습니다';
        if (err) {
            console.log(err);
        } else {
            message = '현재 ' + result.length + '팀이 앞에 있습니다.'; 
        }
        res.json({
            'message' : message,
            'result' : result.length
        });
    });
});

// 사용자 stamp 개수 확인
app.post('/user/stamp', function(req, res) {
    var WaitIndex = req.body.WaitIndex;

    var sql = 'SELECT Stamp From Users WHERE Users.UserPhone = (SELECT UserPhone From Waiting WHERE WaitIndex = ?);'; // stamp 개수 가져오기
    var params = [WaitIndex];
    sql = mysql.format(sql, params);

    connection.query(sql, function(err, result) {
        if (err) {
            console.log(err);
            return;
        }

        if(result[0].Stamp <= 0) {
            res.json({
                'stamp' : result[0].Stamp,
                'message' : '스탬프가 부족합니다.'
            });
        } else {
            res.json({
                'stamp' : result[0].Stamp,
                'message' : '스탬프 개수는 ' + result[0].Stamp + '개 입니다.'
            });
        }
    });
});

// 대기 미루기
app.post('/user/waiting/postpone', function(req, res) {
    var WaitIndex = req.body.WaitIndex;
    var resPhNum = req.body.resPhNum;

    var sql1 = 'SET @tmp = ?; SET @back = (SELECT WaitIndex FROM Waiting WHERE (                                                                                                                                                             resPhNum = ? AND WaitIndex > @tmp) ORDER BY WaitIndex LIMIT 1);'; // 변수 설정
    var sql2 = 'UPDATE Users SET Stamp = Stamp - 1 WHERE Users.UserPhone = (SELE                                                                                                                                                             CT UserPhone From Waiting WHERE WaitIndex = @tmp);'; // stamp 개수 update
    var sql3 = 'UPDATE Waiting SET WaitIndex = -1 WHERE WaitIndex = @tmp;'; //                                                                                                                                                              대기 미루기
    var sql4 = 'UPDATE Waiting SET WaitIndex = @tmp WHERE WaitIndex = @back;';
    var sql5 = 'UPDATE Waiting SET WaitIndex = @back WHERE WaitIndex = -1;';
    var params1 = [WaitIndex, resPhNum];

    sql1 = mysql.format(sql1, params1);

    // 변수 설정
    connection.query(sql1, function (err1, result1) {
        if (err1) {
            console.log(err1);
            return;
        }
        // stamp 개수 update
        connection.query(sql2, function (err2, result2) {
            if(err2) {
                console.log(err2);
                return;
            }
            // 대기 미루기 실행
            connection.query(sql3, function (err3, result3) {
                if(err3) {
                    console.log(err3)
                    return;
                }
                connection.query(sql4, function (err4, result4) {
                    if(err4) {
                        console.log(err4);
                        return;
                    }
                    connection.query(sql5, function (err5, result5) {
                        if(err5) {
                            console.log(err5);
                            return;
                        }
                        res.json({
                            'message' : '대기 미루기 완료'
                        });
                    });
                });
            });
        });
    });
});
