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
/* 
var connection = mysql.createConnection({
    host: "",
    user: "",
    database: "",
    password: "",
    port: 
});
*/

// 유저 대기 걸기
app.post('/user/waiting/insert', function(req, res) {
Expand Down
Expand Up
	@@ -67,116 +397,14 @@ app.post('/user/waitindex', function(req, res) {
        if (err) {
            console.log(err);
            return;
        } 

        res.json({
            result
        });
    });
});

// 유저 대기 걸기
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

// // 유저 대기 걸기2 (waitIndex 반환)
// app.post('/user/waiting/insert2', function(req, res) {
//     var UserPhone = req.body.UserPhone;
//     var resPhNum = req.body.resPhNum;
//     var Waitheadcount = req.body.Waitheadcount;
//     var WaitTime = req.body.WaitTime;
//     var WaitSeat = req.body.WaitSeat;
//     var WaitisAccepted = false;

//     var sql1 = 'INSERT INTO Waiting (UserPhone, resPhNum, WaitHeadcount, WaitTime, WaitSeat, WaitisAccepted) VALUES(?, ?, ?, ?, ?, ?);';
//     var sql2 = 'SELECT WaitIndex FROM Waiting WHERE (UserPhone = ? AND resPhNum = ? AND WaitTime = ?);';
//     var params1 = [UserPhone, resPhNum, Waitheadcount, WaitTime, WaitSeat, WaitisAccepted];
//     var params2 = [UserPhone, resPhNum, WaitTime];
//     sql1 = mysql.format(sql1, params1);
//     sql2 = mysql.format(sql2, params2);

//     connection.query(sql1 , function(err1, result1) {
//         if(err1) {
//             console.log(err1);
//             res.json({
//                 'message' : '대기 insert 에러 발생'
//             });
//             return;
//         }
//         connection.query(sql2, function (err2, result2) {
//             if(err2) {
//                 console.log(err2);
//                 res.json({
//                     'message' : '에러 발생'
//                 });
//                 return;
//             }

//             res.json({
//                 'WaitIndex' : result2,
//                 'UserPhone': UserPhone,
//                 'resPhNum': resPhNum,
//                 'Waitheadcount': Waitheadcount,
//                 'WaitTime': WaitTime,
//                 'WaitSeat': WaitSeat,
//                 'WaitisAccepted': WaitisAccepted,
//                 'message' : '등록 / 인덱스 확인 완료!'
//             });
//         })
//     })
// });

// 대기 내역 삭제
app.delete('/user/waiting/delete', function(req, res) {
    var WaitIndex = req.body.WaitIndex;
Expand All
	@@ -200,38 +428,11 @@ app.delete('/user/waiting/delete', function(req, res) {
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

// 과거 대기 내역
// 아이디, 레스토랑 이름, 레스토랑 사진, 대기일자
app.post('/user/waited', function(req, res) {
    var UserPhone = req.body.UserPhone;
    
    var sql1 = 'SELECT UserPhone, resPhNum, acceptedTime, resName, resImg, resIdx From (SELECT * FROM Waited NATURAL JOIN Restaurants) Waited WHERE UserPhone = ?;';
    var params1 =[UserPhone];
    sql1 = mysql.format(sql1, params1);
Expand All
	@@ -244,93 +445,989 @@ app.post('/user/waited', function(req, res) {

        res.json({
            result1
        }) 
    });
});

<<<<<<< HEAD
//대기자 명단 확인
app.post('/kiosk/waitinginfo', function(req, res) {
    var resPhNum = req.body.resPhNum;

    var sql = 'SELECT WaitIndex, Users.UserPhone, WaitHeadcount, keyWord, WaitisAccepted FROM Users, Waiting WHERE (Waiting.UserPhone = Users.UserPhone AND resPhNum = ? AND WaitisAccepted = 0)';
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
=======
//대기 미루기
>>>>>>> cc14d7071756cac7457ce9270277ac765d931cbc
app.post('/user/waiting/postpone', function(req, res) {
    var WaitIndex = req.body.WaitIndex;
    var resPhNum = req.body.resPhNum;

    var sql1 = 'SET @tmp = ?; SET @back = (SELECT WaitIndex FROM Waiting WHERE (resPhNum = ? AND WaitIndex > @tmp) ORDER BY WaitIndex LIMIT 1);'; // 변수 설정
    var sql2 = 'UPDATE Users SET Stamp = Stamp - 1 WHERE Users.UserPhone = (SELECT UserPhone From Waiting WHERE WaitIndex = @tmp);'; // stamp 개수 update
    var sql3 = 'UPDATE Waiting SET WaitIndex = -1 WHERE WaitIndex = @tmp;'; // 대기 미루기
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

// 대기 미루기
app.post('/user/waiting/postpone', function(req, res) {
    var WaitIndex = req.body.WaitIndex;
    var resPhNum = req.body.resPhNum;

    var sql1 = 'SET @tmp = ?; SET @back = (SELECT WaitIndex FROM Waiting WHERE (resPhNum = ? AND WaitIndex >= @tmp) ORDER BY WaitIndex DESC LIMIT 1,1);'; // 변수 설정
    var sql2 = 'SELECT Stamp From Users WHERE Users.UserPhone = (SELECT UserPhone From Waiting WHERE WaitIndex = @tmp);'; // stamp 개수 가져오기
    var sql3 = 'UPDATE Users SET Stamp = Stamp - 1 WHERE Users.UserPhone = (SELECT UserPhone From Waiting WHERE WaitIndex = @tmp);'; // stamp가 남아있다면, 개수 update
    var sql4 = 'UPDATE Waiting SET WaitIndex = -1 WHERE WaitIndex = @tmp;';
    var sql5 = 'UPDATE Waiting SET WaitIndex = @tmp WHERE WaitIndex = @back;';
    var sql6 = 'UPDATE Waiting SET WaitIndex = @back WHERE WaitIndex = -1;';
    var params1 = [WaitIndex, resPhNum];

    sql1 = mysql.format(sql1, params1);

    // 변수 설정
    connection.query(sql1, function (err1, result1) {
        if (err1) {
            console.log(err1);
            return;
        }
        // stamp 개수 가져오기
        connection.query(sql2, function (err2, result2) {
            if(err2) {
                console.log(err2);
                return;
            }
            if(result2[0] <= 0) {
                res.json({
                    'message' : '스탬프가 부족합니다.'
                })
                return;
            }
            // stamp가 남아있다면, 개수 update
            connection.query(sql3, function (err3, result3) {
                if(err3) {
                    console.log(err3)
                    return;
                }
                // 대기 미루기 실행
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
                        connection.query(sql6, function (err6, result6) {
                            if(err6) {
                                console.log(err6);
                                return;
                            }
                            res.json({
                                'message' : '대기 미루기 완료',
                            });
                        });
                    });
                });
            });
        });
    });
});
