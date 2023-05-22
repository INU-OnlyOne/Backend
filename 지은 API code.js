var cron = require('node-cron');
var express = require('express');
var app = express();
var mysql = require('mysql');
var bodyParser = require('body-parser');
//이미지
const path = require("path");
const resImgPath = path.join(__dirname, "postImage/restaurant");
const revImgPath = path.join(__dirname, "postImage/review");
const multer = require("multer");
const uuid4 = require("uuid4");

app.use(express.static(resImgPath));//레스토랑 이미지
app.use(express.static(revImgPath));//리뷰  이미지
app.use(bodyParser.json({extended: true})); //사용자가 웹사이트로 전달하는 정보들을 검사>하는 미들웨어
app.use(bodyParser.urlencoded({extended: true})); //json이 아닌 post형식으로올때 파서

// 서버 시작
app.listen(3000, function() {
  console.log('서버 실행 중...');
});

// MySQL 연결 설정
var connection = mysql.createConnection({
  host: 'db-onlyone.c8uqamkhlhza.ap-northeast-2.rds.amazonaws.com',
  user: 'admin',
  password: 'admin0101',
  database: 'onlyone',
  port: 3306,
  multipleStatements: true
});

// 매일 자정에 WaitingTotal_Hour,Date 업데이트
cron.schedule('0 0 * * *', () => {
  updateWaitingTotalHour();
  updateWaitingTotalDate();
  console.log('매일 자정마다 작업 실행:', new Date().toString());
});

function updateWaitingTotalHour() {
  const sql = 'SELECT resPhNum, Hour(WaitTime) as WaitTime FROM Waiting';
  connection.query(sql, (err, rows, fields) => {
    if (err) {
      console.log(err);
    } else {
      rows.forEach((row) => {
        const resPhNum = row.resPhNum;
        const WaitTime = row.WaitTime;
        if (!resPhNum) { // resPhNum이 null인지 확인
          console.log('resPhNum이 null인 행을 건너뜁니다.');
          return;
        }
        let hour;
        // 분기문을 사용하여 WaitTime에 따라 적절한 칼럼 선택
        if (WaitTime >= 0 && WaitTime < 2) {
          hour = 0;
        } else if (WaitTime >= 2 && WaitTime < 4) {
          hour = 2;
        } else if (WaitTime >= 4 && WaitTime < 6) {
          hour = 4;
        } else if (WaitTime >= 6 && WaitTime < 8) {
          hour = 6;
        } else if (WaitTime >= 8 && WaitTime < 10) {
          hour = 8;
        } else if (WaitTime >= 10 && WaitTime < 12) {
          hour = 10;
        } else if (WaitTime >= 12 && WaitTime < 14) {
          hour = 12;
        } else if (WaitTime >= 14 && WaitTime < 16) {
          hour = 14;
        } else if (WaitTime >= 16 && WaitTime < 18) {
          hour = 16;
        } else if (WaitTime >= 18 && WaitTime < 20) {
          hour = 18;
        } else if (WaitTime >= 20 && WaitTime < 22) {
          hour = 20;
        } else if (WaitTime >= 22 && WaitTime < 24) {
          hour = 22;
        }

        const updateSql = `
          INSERT INTO WaitingTotal_Hour (resPhNum, ${hour}_)
          VALUES (?, 1)
          ON DUPLICATE KEY UPDATE ${hour}_ = COALESCE(${hour}_, 0) + 1;
        `;
        console.log(`Update SQL for resPhNum=${resPhNum}: \n ${updateSql}`); // 출력: update SQL for each row
        const updateParams = [resPhNum];
        connection.query(updateSql, updateParams, (err, result) => {
          if (err) {
            console.log(err);
          } else {
            console.log(`WaitingTotal_Hour 테이블의 ${resPhNum} 업데이트가 성공했습니다.`);
          }
        });
      });
    }
  });
}

function updateWaitingTotalDate() {
  const sql = 'SELECT resPhNum, DAYOFWEEK(WaitTime) as DayOfWeek FROM Waiting';
  connection.query(sql, (err, rows, fields) => {
    if (err) {
      console.log(err);
    } else {
      rows.forEach((row) => {
        const resPhNum = row.resPhNum;
        const DayOfWeek = row.DayOfWeek;
        if (!resPhNum) { // resPhNum이 null인지 확인
          console.log('resPhNum이 null인 행을 건너뜁니다.');
          return;
        }
        let day;
        // 분기문을 사용하여 DayOfWeek에 따라 적절한 칼럼 선택
        switch (DayOfWeek) {
          case 1: day = 'Sun'; break;
          case 2: day = 'Mon'; break;
          case 3: day = 'Tue'; break;
          case 4: day = 'Wed'; break;
          case 5: day = 'Thu'; break;
          case 6: day = 'Fri'; break;
          case 7: day = 'Sat'; break;
        }
        const updateSql = `
          INSERT INTO WaitingTotal_Date (resPhNum, ${day})
          VALUES (?, 1)
          ON DUPLICATE KEY UPDATE ${day} = COALESCE(${day}, 0) + 1;
        `;
        console.log(`Update SQL for resPhNum=${resPhNum}: \n ${updateSql}`); // 출력: update SQL for each row
        const updateParams = [resPhNum];
        connection.query(updateSql, updateParams, (err, result) => {
          if (err) {
            console.log(err);
          } else {
            console.log(`WaitingTotal_Date 테이블의 ${resPhNum} 업데이트가 성공했습니다.`);
          }
        });
      });
    }
  });
}


// 아이디 중복 확인
app.post('/user/checkId', function (req,res) {
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
app.post('/user/join', function (req,res) {
        var userPhone = req.body.userPhone;
        var userPW = req.body.userPW;
        var userGender = req.body.userGender;
        var userBirth = req.body.userBirth;
        var userIsWaiting = false;
        var userName = req.body.userName;
        var Stamp = 1;
        var keyword = req.body.keyword;

        var sql = 'INSERT INTO Users (UserPhone, UserPw, UserGender, UserBirth, UserIsWaiting, UserName, Stamp, keyword) VALUES (?, ?, ?, ?, ?, ?, ?)';
        var params = [userPhone, userPW, userGender, userBirth, userIsWaiting, userName, Stamp, keyword];

        connection.query(sql, params, function (err, result) {
                if (err) {
                        console.log(err);
                } else {
                        res.json({
                                result: true,
                                msg: '회원가입에 성공했습니다.'
                        })
                }
        });
});

// 사용자 로그인
app.post('/user/login', function (req, res) {
    var userPhone = req.body.userPhone;
    var userPW = req.body.userPW;

    var sql1 = 'select UserID, UserName from Users where UserPhone = ?;';
    var sql2 = 'select WaitIndex from Waiting where UserPhone = ?;';

    var params = [userPhone, userPhone];

    connection.query(sql1+sql2, params, function(err, results) {
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
app.post('/mypage/leaveId', function (req, res) {
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

// 음식점 이름으로 음식점 정보 가져오는 API (수정 0412)
app.post('/restaurant/name', function (req, res) {
  var resName = req.body.resName;
  resName = '%'+resName+'%'
  console.log(resName, typeof(resName));
  var sql = 'select * from Restaurants where resName like ?';
  connection.query(sql, [resName], function (err, results) {
    if (err)
        console.log(err);
    else {
        if (results.length == 0) {

        } else {
        res.json({
            results
        });
        }
         }
     });
});

//ㅇㅇ구 음식점 정보 가져오는 API (수정 0412)
app.post('/restaurants', function (req, res) {
  var resAddress = req.body.resAddress;
  resAddress = '%'+resAddress+'%'
  console.log(resAddress, typeof(resAddress));
  var sql = 'select * from Restaurants where resAddress like ?';
  connection.query(sql, [resAddress], function (err, results) {
    if (err)
        console.log(err);
    else {
        if (results.length == 0) {

        } else {
        res.json({
            results
        });
        }
         }
     });
});

//ㅇㅇ구 음식점 카테고리 정보 가져오는 API (수정 0412)
app.post('/restaurants/category', function (req, res) {
  var resAddress = req.body.resAddress;
  resAddress = '%'+resAddress+'%'
  var resCategory = req.body.resCategory;
  console.log(resAddress, typeof(resAddress));
  var sql = 'select * from Restaurants where resAddress like ? and resCategory = ?';
  connection.query(sql, [resAddress, resCategory], function (err, results) {
    if (err)
        console.log(err);
    else {
        if (results.length == 0) {

        } else {
        res.json({
            results
        });
        }
         }
     });
});

// 레스토랑 id로 정보 가져오기
app.post('/restaurant/id', function (req, res) {
    var ResID = req.body.ResID;

    var sql = 'select * from Restaurants where resIdx=?';
    var params = ResID;

    connection.query(sql, params, function (err, result) {
        var resultCode = 404;
        var message = '에러 발생';

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            message = result;
        }

        res.send(result)
    })
});

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

// 대기 내역 삭제
app.delete('/user/waiting/delete', function(req, res) {
    var WaitIndex = req.body.WaitIndex;
    var params = [WaitIndex];

    var sql = 'DELETE FROM Waiting WHERE WaitIndex = ?';

    connection.query(sql, params, function (err, result) {
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            message = '대기 신청이 취소되었습니다.';
        }

        res.json({
            'WaitIndex' : WaitIndex,
            'message' : message
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

// 웨이팅 신청
function getFormatTime(date) {
    var hh = date.getHours(); // 시간
    hh = hh >= 10 ? hh : '0' + hh ;
    var mm = date.getMinutes(); // 분
    mm = mm >= 10 ? mm : '0' + mm ;
    var ss = date.getSeconds(); // 초
    ss = ss >= 10 ? ss : '0' + ss ;
    return hh + ':' + mm + ':' + ss;
}

app.post('/restaurant/waiting', function(req, res) {
    var UserPhone = req.body.UserPhone;
    var resPhNum = req.body.resPhNum;
    var Waitheadcount = req.body.Waitheadcount;
    var WaitSeat = req.body.WaitSeat;

    var sql1 = 'SELECT resWaitOpen, resWaitClose FROM Restaurants WHERE resPhNum = ?;';
    var sql2 = 'select UserIsWaiting from Users where UserPhone = ?;';
    var sql3 = 'INSERT INTO Waiting (UserPhone, resPhNum, WaitHeadcount, WaitTime, WaitSeat, WaitisAccepted) VALUES(?, ?, ?, now(), ?, 0);';
    var sql4 = 'update Restaurants set currWaiting = currWaiting+1 where resPhNum = ?;';
    var sql5 = 'update Users set UserIsWaiting = 1 where UserPhone = ?;';

    var params1 = [resPhNum];
    var params2 = [UserPhone];
    var params3 = [UserPhone, resPhNum, Waitheadcount, WaitSeat];
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
                                        'message': '레스토랑 데이터 업데이트 에                                                                             러'
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
app.post('/mypage/review', function (req, res) {
    var userId = req.body.userId;
    var sql = 'select Res.ResIdx, Res.resName, Rev.RevTime, Rev.RevImg, Rev.RevTxt, Rev.Rating, Rev.RevSatis, Rev.RevKeyWord from Reviews Rev join Restaurants Res on Rev.ResID=Res.ResIdx where Rev.UserId = ?';

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

// 리뷰 등록
const upReviewImg = multer({
  storage: multer.diskStorage({
    filename(req, file, done) {
      const randomID = uuid4();
      const ext = path.extname(file.originalname);
      const filename = randomID + ext;
      done(null, filename);
    },
    destination(req, file, done) {
      done(null, path.join(__dirname, "postImage/review"));
    },
  }),
});

const uploadMiddlewareRev = upReviewImg.single("myFile");

app.post('/review', uploadMiddlewareRev, function (req, res) {
    var UserID = req.body.UserID;
    var ResID = req.body.ResID;
    var Rating = req.body.Rating;
    var RevTxt = req.body.RevTxt;
    var RevKeyWord =  req.body.RevKeyWord;
    var RevSatis = req.body.RevSatis;
    var RevRecom = req.body.RevRecom;
    var RevTime = req.body.RevTime;
    var ImgPath = '';

    // Check if image file exists
    if (req.file) {
        ImgPath = req.file.filename;
    }

    var sql1 = 'insert into Reviews (UserID, ResID, Rating, RevTxt, RevKeyWord, RevSatis, RevRecom, RevTime, RevImg) values (?, ?, ?, ?, ?, ?, ?, ?, ?);';
    var sql2 = 'update Reviews join Users on Reviews.UserID = Users.UserID set Reviews.UserName = (select UserName from Users where Users.UserID=?) where Reviews.UserID = ?;';
    var params1 = [UserID, ResID, Rating, RevTxt, RevKeyWord, RevSatis, RevRecom, RevTime, ImgPath];
    var params2 = [UserID, UserID];
    sql1 = mysql.format(sql1,params1);
    sql2 = mysql.format(sql2, params2);
    connection.query(sql1, function (err1, result1) {
        if (err1) {
            console.log(err1);
            res.json({
                'message': '에러 발생'
            });
            return;
        }
        connection.query(sql2, function (err2, result2) {
            if (err2) {
                console.log(err2);
                res.json({
                    'message': '에러 발생'
                });
                return;
            }

            res.json({
                'UserID': UserID,
                'ResID': ResID,
                'Rating': Rating,
                'RevTxt': RevTxt,
                'RevKeyWord': RevKeyWord,
                'RevSatis' : RevSatis,
                'RevRecom' : RevRecom,
                'RevTime' : RevTime,
                'ImgPath' : ImgPath,
                'message': '리뷰 등록 성공'
            });

            // Update the number of reviews for the restaurant
            var sql3 = 'update Restaurants join Reviews on Restaurants.resIdx = Reviews.ResID set Restaurants.revCnt = (select count(Reviews.RevIdx) from Reviews where Reviews.ResID=?) where Restaurants.resIdx = ?';
            var params3 = [ResID, ResID];
            sql3 = mysql.format(sql3, params3);

            connection.query(sql3, function (err3, result3) {
                if (err3) {
                    console.log(err3);
                    return;
                }
                console.log("Number of reviews updated for restaurant");

            });

            // Update the rating of the restaurant
            var sql4 = 'update Restaurants join Reviews on Restaurants.resIdx = Reviews.ResID set Restaurants.resRating = (select avg(Rating) from Reviews where Reviews.ResID=?) where Restaurants.resIdx = ?';
            var params4 = [ResID, ResID];
            sql4 = mysql.format(sql4, params4);

            connection.query(sql4, function (err4, result4) {
                if (err4) {
                    console.log(err4);
                    return;
                }
                console.log("Rating updated for restaurant");

            });
        });
    });
});


// 레스토랑 별 리뷰
app.post('/restaurant/reviews', function (req, res) {
    var ResID = req.body.ResID;

    var sql = 'select * from Reviews where ResID=?';
    var params = ResID;

    connection.query(sql, params, function (err, result) {
        var resultCode = 404;
        var message = '에러 발생';

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            message = result;
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

// 레스토랑  이미지 업로드
const upResImg = multer({
  storage: multer.diskStorage({
    filename(req, file, done) {
      const randomID = uuid4();
      const ext = path.extname(file.originalname);
      const filename = randomID + ext;
      done(null, filename);
    },
    destination(req, file, done) {
      done(null, path.join(__dirname, "postImage/restaurant"));
    },
  }),
});

const uploadMiddlewareRes = upResImg.single("myFile");

app.post("/upload/restaurant/image", uploadMiddlewareRes, (req, res) => {
    var ImgPath = req.file.filename;
    var resIdx = req.body.resIdx;

    var sql = 'UPDATE Restaurants SET resImg=? WHERE resIdx=?';

    var params = [ImgPath, resIdx];

    connection.query(sql, params, function (err, result) {
        var resultCode = 404;
        var message = '이미지 업로드 실패';

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            message = '이미지 업로드 성공';
        }
        res.json({
            'ImgPath': ImgPath,
            'resIdx' : resIdx,
            'message': message
        });
    });
});

// 리뷰 이미지 이름 가져오기
app.post('/review/image', function (req, res) {
    var RevIdx = req.body.RevIdx;

    var sql = 'select RevImg from Reviews where RevIdx=?';
    var params = RevIdx;

    connection.query(sql, params, function (err, result) {
        var resultCode = 404;
        var message = '에러 발생';

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            message = result;
        }

        res.json({
            'RevIdx' : RevIdx,
            result
        });
    });
});

// 레스토랑 이미지 이름 가져오기
app.post('/restaurant/image', function (req, res) {
    var ResID = req.body.ResID;

    var sql = 'select resImg from Restaurants where resIdx=?';
    var params = ResID;

    connection.query(sql, params, function (err, result) {
        var resultCode = 404;
        var message = '에러 발생';

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            message = result;
        }

        res.json({
            'ResID' : ResID,
            result
        });
    });
});

// 키워드 기반 추천
app.post('/main/recommend', function(req, res) {
    var userId = req.body.userId;
    var sql1 = 'select keyword from Users where UserId = ?;';
    var sql2 = 'select keyWord, resIdx, resAddress, resName, resImg, resRating, revCnt from Restaurants;';

    connection.query(sql1+sql2, userId, function(err, results) {
        var result1 = results[0];
        var result2 = results[1];

        var resultCode = 404;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            var str = result1[0].keyword;
            var tmp_str = str.slice(1, -1);
            var userKey = (tmp_str||'').split(',');

            var ans = [];
            for (var i = 0; i<result2.length; i++) {
                var cnt = 0;
                var str2 = result2[i].keyWord;
                var tmp_str2 = str2.slice(1, -1);
                var resKey = (tmp_str2||'').split(',');

                for (var j = 0; j<3; j++) {
                    if (resKey[j] == userKey[0] | resKey[j] == userKey[1] | resKey[j] == userKey[2]) {
                        cnt += 1;
                    }
                }
                if (cnt > 1) {
                    ans.push(result2[i]);
                }
            }

            resultCode = 200;
            message = ans;
        }

        res.json({
            'code': resultCode,
            'message': message
        });
    })
});

// 성별별 선호도
app.post('/restaurant/gender', function (req, res) {
    var ResID = req.body.ResID;
    var Mcnt = 0;
    var Fcnt = 0;

    var sql = 'SELECT UserGender FROM Users WHERE UserID IN (SELECT UserID FROM Reviews WHERE ResID=3 AND RevSatis=1);';
    var params = ResID;

    connection.query(sql, params, function (err, result) {
        if (err) {
            console.log(err);
            res.json({
                'message': '에러 발생'
            });
            return;
        }

        result.forEach(function (row) {
            if (row.UserGender === 'M') {
                Mcnt++;
            } else if (row.UserGender === 'F') {
                Fcnt++;
            }
        });

        res.json({
            'ResID': ResID,
            'cntM': Mcnt,
            'cntF': Fcnt,
            'message': '성별별 선호도'
        });
    });
});

// 연령별 선호도
app.post('/restaurant/age', function (req, res) {
    var ResID = req.body.ResID;
    var cnt10 = 0;
    var cnt20 = 0;
    var cnt30 = 0;
    var cnt40 = 0;
    var cnt50 = 0;

    var sql = 'SELECT UserBirth FROM Users WHERE UserID IN (SELECT UserID FROM Reviews WHERE ResID=? AND RevSatis=1);';
    var params = [ResID];

    connection.query(sql, params, function (err, result) {
        if (err) {
            console.log(err);
            res.json({
                'message': '에러 발생'
            });
            return;
        }

        result.forEach(function (row) {
            var birthYear = String(row.UserBirth.getFullYear()).substr(0, 4);
            var currentYear = new Date().getFullYear();
            var age = (currentYear+1) - parseInt(birthYear, 10);
            if (age < 20) {
                cnt10++;
            } else if (age < 30) {
                cnt20++;
            } else if (age < 40) {
                cnt30++;
            } else if (age < 50) {
                cnt40++;
            } else {
                cnt50++;
            }
        });


        res.json({
            'ResID': ResID,
            'cnt10': cnt10,
            'cnt20': cnt20,
            'cnt30': cnt30,
            'cnt40': cnt40,
            'cnt50': cnt50,
            'message': '연령별 선호도'
        });
    });
});

// 키오스크 레스토랑 정보 수정
app.post('/kiosk/information/modify', function (req, res) {
    var resIdx = req.body.resIdx;
    var updateColumns = [
        {name: 'resMngNum', value: req.body.resMngNum},
        {name: 'resName', value: req.body.resName},
        {name: 'resAddress', value: req.body.resAddress},
        {name: 'resCategory', value: req.body.resCategory},
        {name: 'resPhNum', value: req.body.resPhNum},
        {name: 'resPwd', value: req.body.resPwd},
        {name: 'resSeat', value: req.body.resSeat},
        {name: 'resSeatCnt', value: req.body.resSeatCnt},
        {name: 'keyWord', value: req.body.keyWord},
        {name: 'ResComment', value: req.body.ResComment},
        {name: 'resOpen', value: req.body.resOpen},
        {name: 'resClose', value: req.body.resClose},
        {name: 'resWaitOpen', value: req.body.resWaitOpen},
        {name: 'resWaitClose', value: req.body.resWaitClose}
    ];

    // 기존 데이터베이스의 값
    var selectSql = `SELECT * FROM Restaurants WHERE resIdx = ${resIdx}`;
    connection.query(selectSql, function (err, rows, fields) {
        if (err) {
            console.log(err);
            res.json({
                'message': '에러 발생'
            });
            return;
        }

        var currentData = rows[0];

        // updateColumns에 값이 있으면 그 값으로 대체
        updateColumns.forEach(column => {
            if (column.value !== undefined) {
                currentData[column.name] = column.value;
            }
        });

        // keyWord는 JSON 문자열로 저장
        if (currentData.keyWord !== undefined && !Array.isArray(currentData.keyWord)) {
            currentData.keyWord = JSON.parse(currentData.keyWord);
        }

        if (Array.isArray(currentData.keyWord)) {
            currentData.keyWord = JSON.stringify(currentData.keyWord);
        }

        var sql = `UPDATE Restaurants SET ? WHERE resIdx = ${resIdx}`;
        connection.query(sql, [currentData], function (err, result) {
            if (err) {
                console.log(err);
                res.json({
                    'message': '에러 발생'
                });
                return;
            }

            currentData['message'] = '레스토랑 정보 수정 성공';
            res.json(currentData);
        });
    });
});

// 시간대별 대기 신청 정도
app.post('/restaurant/hour', function (req, res) {
    var resPhNum = req.body.resPhNum;

    var sql = 'select * from WaitingTotal_Hour where resPhNum=?';
    var params = resPhNum;

    connection.query(sql, params, function (err, result) {
        var resultCode = 404;
        var message = '에러 발생';

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            message = result;
        }

        res.send(result);
    })
});

// 요일별 대기 신청 정도
app.post('/restaurant/date', function (req, res) {
    var resPhNum = req.body.resPhNum;

    var sql = 'select * from WaitingTotal_Date where resPhNum=?';
    var params = resPhNum;

    connection.query(sql, params, function (err, result) {
        var resultCode = 404;
        var message = '에러 발생';

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            message = result;
        }

        res.send(result);
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
                                'message': 'Restaurants update 에러가 발생했습니다.'
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
    var sql = 'update Waited set WaitIsAccepted = 2 where waitedIdx = ?;';

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
