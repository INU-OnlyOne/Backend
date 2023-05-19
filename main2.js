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
    host: "db-onlyone.c8uqamkhlhza.ap-northeast-2.rds.amazonaws.com",
    user: "admin",
    database: "onlyone",
    password: "admin0101",
    port: 3306
});

// 사용자 회원가입
app.post('/user/join', function (req, res) {
    var userPhone = req.body.userPhone;
    var userPW = req.body.userPW;
    var userGender = req.body.userGender;
    var userBirth = req.body.userBirth;
    var userIsWaiting = false;
    var userName = req.body.userName;
    var Stamp = 0;

    // 삽입을 수행하는 sql문.
    var sql = 'INSERT INTO Users (UserPhone, UserPw, UserGender, UserBirth, UserIsWaiting, UserName, Stamp) VALUES (?, ?, ?, ?, ?, ?, ?)';
    var params = [userPhone, userPw, userGender, userBirth, userIsWaiting, userName, Stamp];

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
    var sql = 'select * from Users where UserPhone = ?';

    connection.query(sql, userPhone, function (err, result) {
        var resultCode = 404;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            if (result.length === 0) {
                resultCode = 204;
                message = '존재하지 않는 계정입니다!';
            } else if (userPW !== result[0].UserPW) {
                resultCode = 204;
                message = '비밀번호가 틀렸습니다!';
            } else {
                resultCode = 200;
                message = '로그인 성공! ' + result[0].UserName + '님 환영합니다!';
            }
        }

        res.json({
            'code': resultCode,
            'message': message
        });
    })
});

// 내가 쓴 리뷰 리스트 확인
app.get('/mypage/review', function (req, res) {
    var userId = req.body.userId;
    var sql = 'select * from Reviews where UserId = ?';

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
                message = '';
                for (var i = 0; i<result.length; i++) {
                     message += result[i].UserID + ' ' + result[i].RevTxt + '\n';
                }
            }
        }

        res.json({
            'code': resultCode,
            'message': message
        });
    })
});