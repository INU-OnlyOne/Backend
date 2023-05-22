var mysql = require('mysql');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json({extended:true })); // 사용자가 웹사이트로 전달하는 정보들을 검사하는 미들웨어
app.use(bodyParser.urlencoded({extended: true})); // jon이 아닌 post 형식으로 올 때 파서

app.listen(3000, function () {
    console.log('서버 실행 중...');
});

// 디비 연결
var connection = mysql.createConnection({
    host: "",
    user: "",
    database: "",
    password: "",
    port: ,
    multipleStatements: true
});

// 아이디 중복 확인
app.get('/user/checkId', function (req,res) {
    var userPhone = req.body.userPhone;
    var sql = 'select * from Users where UserPhone = ?';

    connection.query(sql, userPhone, function (err, result) {
            if (err)
                    console.log(err);
            else {
                    if (result.length === 0) {
                            res.json({
                                    result: false,
                                    msg: '사용가능한 아이디입니다.'
                            });
                    } else {
                            res.json({
                                    result: true,
                                    msg: '중복된 아이디가 존재합니다.'
                            });
                    }
            }
    })
});

// 사용자 회원가입
app.post('/user/join', function (req, res) {
    var userPhone = req.body.userPhone;
    var userPW = req.body.userPW;
    var userGender = req.body.userGender;
    var userBirth = req.body.userBirth;
    var userIsWaiting = false;
    var userName = req.body.userName;
    var keyword = req.body.keyword;
    var Stamp = 0;

    // 삽입을 수행하는 sql문.
    var sql = 'INSERT INTO Users (UserPhone, UserPw, UserGender, UserBirth, UserIsWaiting, UserName, Stamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    var params = [userPhone, userPW, userGender, userBirth, userIsWaiting, userName, Stamp, keyword];

    // sql 문의 ?는 두번째 매개변수로 넘겨진 params의 값으로 치환된다.
    connection.query(sql, params, function (err, result) {
        var resultCode = 404;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            message = '회원가입에 성공했습니다.';
        }

        res.json({
            'userPhone': userPhone,
            'userPw': userPw,
            'userGender': userGender,
            'userBirth': userBirth,
            'userName': userName,
            'code': resultCode,
            'message': message
        });
    });
});

// 사용자 로그인
app.post('/user/login', function (req, res) {
    var userPhone = req.body.userPhone;
    var userPW = req.body.userPW;

    var sql1 = 'select UserID, UserPhone from Users where UserPhone = ?;';
    var sql2 = 'select WaitIndex from Waiting where UserPhone = ?;';

    connection.query(sql1+sql2, userPhone, function(err, results) {
        var result1 = results[0];
        var result2 = results[1];

        var resultCode = 404;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            if (result1.length === 0) {
                resultCode = 204;
                message = '존재하지 않는 계정입니다!';
            } else if (userPW !== result1[0].UserPW) {
                resultCode = 204;
                message = '비밀번호가 틀렸습니다!';
            } else {
                resultCode = 200;
                message = result;
            }

            resultCode = 200;
            message = results;
        }

        res.json({
            'code': resultCode,
            'message': message
        })
    })
});

// 사용자 회원탈퇴
app.delete('/mypage/leaveId', function (req, res) {
    var userPhone = req.body.userPhone;
    var userPW = req.body.userPW;

    var sql = 'delete from Users where UserPhone = ? and UserPW = ?';
    var params = [userPhone, userPW];

    connection.query(sql, params, function (err, result) {
        var resultCode = 404;
        var message = '에러가 발생했습니다.';

        if (err) {
            console.log(err);
        } else {
            if (result.affectedRows === 0) {
                resultCode = 200;
                message = '아이디 또는 비밀번호 오류입니다';
            }
            else {
                resultCode = 200;
                message = '회원 탈퇴가 완료되었습니다.';
            }
        }

        res.json({
            'code': resultCode,
            'message': message
        });
    })
});

// 이번 주 hot했던 음식점
app.post('/main/hot', function(req,res) {
    var sql = 'select resIdx, resName, resAddress, resImg, revCnt, resRating from Restaurants order by waitingCnt desc limit 10;';

    connection.query(sql, function(err, result) {
            var resultCode = 404;
            var message = '에러가 발생했습니다.';

            if (err) {
                    console.log(err);
            } else {
                    resultCode = 200;
                    message = result;
            }

            res.json({
                    'code': resultCode,
                    'message': message
            });
    })
});

// 키워드 기반 추천
app.get('/main/recommend', function(req, res) {
    var userId = req.body.userId;
    var sql1 = 'select keyword from Users where UserId = ?;';
    var sql2 = 'select * from Restaurants';

    connection.query(sql1+sql2, userId, function(err, results) {
        var result1 = results[0];
        var result2 = results[1];

        var resultCode = 404;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            var str = result1[0].keyword;
            var userKey = (str||'').split(',');

            var ans = [];
            for (var i = 0; i<result2.length; i++) {
                var cnt = 0;
                var str2 = result2[i].keyword;
                var resKey = (str2||'').split(',');

                for (var j = 0; j<3; j++) {
                    if (resKey[j] == userKey[0] | resKey[j] == userKey[1] | resKey[j] == userKey[2]) {
                        cnt += 1;
                    }
                }
                if (cnt >= 2) {
                    ans.push(result2[i].resName);
                }
            }

            resultCode = 200;
            message = ans;
        }

        res.json({
            'code': resultCode,
            'message': message
        })
    })
});

// 웨이팅 신청
app.post('/restaurant/waiting', function(req, res) {
    var UserPhone = req.body.UserPhone;
    var resPhNum = req.body.resPhNum;
    var WaitHeadcount = req.body.WaitHeadcount;
    var WaitSeat = req.body.WaitSeat;

    var sql1 = 'SELECT resWaitOpen, resWaitClose FROM Restaurants WHERE resPhNum = ?;';
    var sql2 = 'select UserIsWaiting from Users where UserPhone = ?;';
    var sql3 = 'INSERT INTO Waiting (UserPhone, resPhNum, WaitHeadcount, WaitTime, WaitSeat, WaitisAccepted) VALUES(?, ?, ?, now(), ?, 0);';
    var sql4 = 'update Restaurants set currWaiting = currWaiting+1 where resPhNum = ?;';
    var sql5 = 'update Users set UserIsWaiting = 1 where UserPhone = ?;';
    
    var params1 = [resPhNum];
    var params2 = [UserPhone];
    var params3 = [UserPhone, resPhNum, WaitHeadcount, WaitSeat];
    var params4 = [resPhNum];
    var params5 = [UserPhone];

    sql1 = mysql.format(sql1, params1);
    sql2 = mysql.format(sql2, params2);
    sql3 = mysql.format(sql3, params3);
    sql4 = mysql.format(sql4, params4);
    sql5 = mysql.format(sql5, params5);

    // 대기 가능한 시간인지 확인
    connection.query(sql1, function(err1, result1) {
        if(err1) {
            console.log(err1);
            res.json({
                'message' : '대기 가능 시간 확인 에러'
            });
        }

        else {
            var nowTime = getFormatTime(new Date());
            if (nowTime < result1[0].resWaitOpen || nowTime > result1[0].resWaitClose) {
                res.json({
                    'message': '대기 가능 시간이 아닙니다.'
                });
                return;
            }

            else {
                // 사용자가 현재 대기 중인지 확인
                connection.query(sql2, function(err2, result2) {
                    if(err2) {
                        console.log(err2);
                        res.json({
                            'message': '사용자 현재 대기 여부 확인 에러'
                        });
                    }

                    else {
                        if (result2[0].UserIsWaiting == 1) {
                            res.json({
                                'message': '대기는 한 번에 한 곳만 신청 가능합니다.'
                            });
                            return;
                        }
                        else {
                            // 대기 신청
                            connection.query(sql3, function(err3, result3) {
                                if(err3) {
                                    console.log(err3);
                                    res.json({
                                        'message': '대기 데이터 추가 에러'
                                    });
                                }
                            })
                            connection.query(sql4, function(err4, result4) {
                                if(err4) {
                                    console.log(err4);
                                    res.json({
                                        'message': '레스토랑 데이터 업데이트 에러'
                                    });
                                }
                            })
                            connection.query(sql5, function(err5, result5) {
                                if(err5) {
                                    console.log(err5);
                                    result.json({
                                        'message': '사용자 데이터 업데이트 에러'
                                    });
                                }
                            })
                            res.json({
                                'message': '대기 신청이 완료되었습니다.'
                            });
                        }
                    }
                }) 
            }
        }
    });
});

// 내가 쓴 리뷰 리스트 확인
app.get('/mypage/review', function (req, res) {
    var userId = req.body.userId;
    var sql = 'select Res.ResID, Res.resName, Rev.RevTime, Rev.RevImg, Rev.RevTxt, Rev.Rating, Rev.RevSatis, Rev.KeyWord from Reviews Rev join Restaurants Res on Rev.ResID=Res.ResIdx where Rev.UserId = ?';

    connection.query(sql, userId, function (err, result) {
        var resultCode = 404;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            if (result.length === 0) {
                resultCode = 200;
                message = '아직 작성한 리뷰가 없습니다.';
            }
            else {
                resultCode = 200;
                message = result;
            }
        }

        res.json({
            'code': resultCode,
            'message': message
        });
    })
});

// 입장 수락
app.post('/kiosk/accept', function(req, res) {
    var waitIndex = req.body.waitIndex;
    var resPhNum = req.body.resPhNum;
    var userPhone = req.body.userPhone;

    var sql1 = 'insert into Waited select * from Waiting where WaitIndex = ?;';
    var sql2 = 'delete from Waiting where WaitIndex = ?;';
    var sql3 = 'update Waited set WaitisAccepted = 1, acceptedTime=now() where WaitedIdx = ?;';
    var sql4 = 'update Restaurants set waitingCnt = waitingCnt + 1, currWaiting = currWaiting - 1 where resPhNum = ?;';
    var sql5 = 'update Users set UserIsWaiting = 0 where userPhone = ?';

    var params1 = [waitIndex];
    var params2 = [waitIndex];
    var params3 = [waitIndex];
    var params4 = [resPhNum];
    var params5 = [userPhone];

    sql1 = mysql.format(sql1, params1);
    sql2 = mysql.format(sql2, params2);
    sql3 = mysql.format(sql3, params3);
    sql4 = mysql.format(sql4, params4);
    sql5 = mysql.format(sql5, params5);

    connection.query(sql1, function(err1, result1) {
            if (err1) {
                    console.log(err1);
                    res.json({
                            'message': 'insert 에러가 발생했습니다.'
                    });
                    return;
            }
    })

    connection.query(sql2, function(err2, result2) {
            if (err2) {
                    console.log(err2);
                    res.json({
                            'message': 'delete 에러가 발생했습니다.'
                    });
                    return;
            }
    })

    connection.query(sql3, function(err3, result3) {
            if (err3) {
                    console.log(err3);
                    res.json({
                            'message': 'Waited update 에러가 발생했습니다.'
                    });
                    return;
            }
    })

    connection.query(sql4, function(err4, result4) {
            if (err4) {
                    console.log(err4);
                    res.json({
                            'message': 'Restaurants update 에러가 발생했습니                                                                             다.'
                    });
                    return;
            }
    })

    connection.query(sql5, function(err5, result5) {
            if (err5) {
                    console.log(err5);
                    res.json({
                            'message': 'Users update 에러가 발생했습니다.'
                    });
                    return;
            }
    })

    res.json({
            'message': '대기가 수락되었습니다.'
    });
});

// 입장 완료(손님 호출)
app.post('/kiosk/enter', function(req,res) {
    var waitIndex = req.body.waitIndex;
    var sql = 'update Waited set isAccepted = 2 where waitIndex = ?;';

    connection.query(sql, waitIndex, function (err, result) {
        var resultCode = 404;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            message = '손님 호출이 완료되었습니다.';
        }

        res.json({
            'code': resultCode,
            'message': message
        });
    })
});

// 타임 아웃
app.post('/kiosk/reject', function(req,res) {
    var waitIndex = req.body.waitIndex;
    var sql = 'delete from Waited where WaitedIdx = ?;';

    connection.query(sql, waitIndex, function (err, result) {
        var resultCode = 404;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            message = '입장이 거부되었습니다.';
        }

        res.json({
            'code': resultCode,
            'message': message
        });
    })
});

// 손님 호출 리스트
app.post('/kiosk/waitedList', function (req, res) {
    var resPhNum = req.body.resPhNum;
    var sql = 'select WaitedIdx, UserPhone, WaitHeadcount, WaitSeat, acceptedTime from Waited where resPhNum = ? and waitIsAccepted = 1 order by acceptedTime';

    connection.query(sql, resPhNum, function (err, result) {
        var resultCode = 404;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            message = result
        }

        res.json({
            'code': resultCode,
            'message': message
        });
    })
});
