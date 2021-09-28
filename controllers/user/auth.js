var { User } = require('../../models')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const secret = require('../../config/jwt').KEY.secret


exports.signIn = async (req, res) => {
    try {
        var isAutoLogin = req.body.isAutoLogin
        var accountId = 0
        var accessToken = ''
        var refreshToekn = ''
        var id_inToken = 0
        var username = ''
        var password = ''
        if (isAutoLogin) {
            console.log('자동 로그인')
            accountId = req.body.accountId
            accessToken = req.body.accessToken
            refreshToekn = req.body.refreshToekn
            //토큰 검증
            jwt.verify(accessToken, secret, (err, user) => {
                if (err) {
                    console.log('액세스토큰 실패, 리프레쉬 검증')
                    jwt.verify(refreshToekn, secret, (err, user) => {
                        if (err) {
                            console.log('리프레쉬토큰 실패')
                            res.status(403).json({ "resultCode": -30, "data": null })
                        } else {
                            console.log('리프레쉬 토큰 검증 성공')
                            id_inToken = user.accountId
                        }
                    })
                } else {
                    console.log('액세스 토큰 검증 성공')
                    id_inToken = user.accessToken
                }
            })
            //토큰검증이 성공후
            if (accountId === id_inToken) {
                console.log('토큰값 일치')
                accessToken = jwt.sign({ accountId }, secret, { expiresIn: "24h" })
                refreshToekn = jwt.sign({ accountId }, secret, { expiresIn: "30d" })
                console.log('자동 로그인 성공')
                res.status(200).json({ "resultCode": 1, "data": { accountId, accessToken, refreshToekn } })
            } else {
                console.log('토큰값 불일치, 자동로그인 실패')
                res.status(400).json({ "resultCode": -20, "data": null })
            }
        } else {
            //아이디,패스워드 입력 로그인
            console.log('아이디,패스워드 입력 로그인')
            username = req.body.username
            password = crypto.createHash('sha512').update(req.body.password).digest('hex')
            var user = await User.findOne({
                where: { username }
            })
            if (user != null) {
                if (user.password === password) {
                    accountId = user.id
                    accessToken = jwt.sign({ accountId }, secret, { expiresIn: "24h" })
                    refreshToekn = jwt.sign({ accountId }, secret, { expiresIn: "30d" })
                    console.log('로그인 성공')
                    res.status(200).json({ "resultCode": 1, "data": { accountId, accessToken, refreshToekn } })
                } else {
                    console.log('비밀번호 불일치 로그인 실패')
                    res.status(400).json({ "resultCode": -20, "data": null })
                }
            } else {
                console.log('유저 없음 로그인 실패')
                res.status(400).json({ "resultCode": -20, "data": null })
            }
        }
    } catch (error) {
        console.log('로그인 실패:' + error)
        res.status(400).json({ "resultCode": -1, "data": null })
    }
}

exports.signUp = async (req, res) => {
    try {
        var username = req.body.username
        var password = crypto.createHash('sha512').update(req.body.password).digest('hex')
        var name = req.body.name
        var phone = req.body.phone
        var nickname = req.body.nickname
        var email = req.body.email
        var auth = req.body.auth
        var join_date = req.body.join_date //날짜로 받고
        var user = await User.findOne({
            where: { username }
        })
        if (user != null) {
            console.log('이미 가입된 회원')
            res.status(400).json({ "resultCode": -10, "data": null })
        } else {
            await User.create({
                username,
                password,
                nickname,
                name,
                phone,
                email,
                auth,
                state: 1,
                join_date,
                resignation_date: null
            })
            console.log('회원가입 성공')
            res.status(200).json({ "resultCode": 1, "data": null })
        }
    } catch (error) {
        console.log('회원 가입 실패:' + error)
        res.status(400).json({ "resultCode": -1, "data": null })
    }
}

exports.userList = async (_, res) => {
    try {
        var items = []
        var name = ''
        var nickname = ''
        var phone = ''
        var email = ''
        var dept = ''
        var profile_img = ''
        var userList = await User.findAll()
        for (var i = 0; i < userList.length; i++) {
            name = userList[i].name
            nickname = userList[i].nickname
            phone = userList[i].phone
            email = userList[i].email
            profile_img = userList[i].profile_img
            dept = userList[i].dept
            items[i] = { name, nickname, phone, email, profile_img, dept }
        }
        console.log('직원 리스트 출력 성공')
        res.status(200).json({ "resultCode": 1, "data": { "items": items } })
    } catch (error) {
        console.log('직원 리스트 실패:' + error)
        res.status(400).json({ "resultCode": -1, "data": null })
    }
}

exports.userInfo = async (req, res) => {
    try {
        var accountId = req.body.accountId
        var user = await User.findOne({
            where: { id: accountId }
        })
        var username = ''
        var name = ''
        var nickname = ''
        var phone = ''
        var email = ''
        var join_date = ''
        var join_cnt = 0
        var join_date_i = ''
        var current_date = ''
        var dept = ''
        if (user != null) {
            username = user.username
            name = user.name
            phone = user.phone
            nickname = user.nickname
            email = user.email
            join_date = user.join_date

            //입사 일수 계산
            join_date_i = new Date(join_date).getTime()
            current_date = new Date().getTime()
            join_cnt = Math.ceil((current_date - join_date_i) / (1000 * 3600 * 24))
            dept = user.dept
            console.log('유저 정보 조회 성공')
            res.status(200).json({ "resultCode": 1, "data": { username, name, nickname, phone, email, join_date, dept, join_cnt } })
        } else {
            console.log('유저 정보 없음')
            res.status(400).json({ "resultCode": -20, "data": null })
        }
    } catch (error) {
        console.log('유저 정보 조회 실패' + error)
        res.status(400).json({ "resultCode": -1, "data": null })
    }
}


exports.userUpdate = async (req,res) => {
    try {
        
    } catch (error) {
        
    }
}