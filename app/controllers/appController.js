// LOGIN FUNCTION
var login = require('../../config/auth').login,
    // DATABASE POOL
    pool = require('../../config/database')(),
    // NODEMAILER TRANSPORTER
    transporter = require('../../config/mailer')();

module.exports = () => {
    // CONTROLLER
    let controller = {
        // LOGIN
        userLogin(req, res) {
            // USER DATA
            let jsonData = req.body;
            login(jsonData.name, jsonData.password, result => {
                // CHECK RESULT
                if (result) {
                    res.send(result);
                }
                // ON ERROR => RESPONSE UNAUTHORIZED 401
                else {
                    res.status(401).json({ message: 'Erro de Autenticação' });
                }
            });
        },
        // GET USERS FUNCTION => /available = post
        isAvailable(req, res) {
            // USER DATA
            let jsonData = req.body,
                // RESPONSE TEMPLATE
                respTemplate = [];
            // CONNECTING TO THE DATABASE
            pool.connect()
            // ON SUCCESS => CONNECTED
                .then(client => {
                    // SELECT QUERY => CHECK IF user_name IS UNIQUE
                    client.query("SELECT * FROM users WHERE user_name = $1", [jsonData.name])
                    // ON SUCCESS
                        .then(result => {
                            // IF NOT UNIQUE respTemplate PUSH A MESSAGE
                            if (result.rowCount > 0) {
                                respTemplate.push('O nome de usuário já está em uso');
                            }
                            // SELECT QUERY => CHECK IF user_email IS UNIQUE
                            client.query("SELECT * FROM users WHERE user_email = $1", [jsonData.email])
                            // ON SUCCESS
                                .then(result => {
                                    // IF NOT UNIQUE respTemplate PUSH A MESSAGE
                                    if (result.rowCount > 0) {
                                        respTemplate.push('O e-mail já está em uso');
                                    }
                                    // RESPONSE OK 200
                                    res.status(200).json({ respTemplate });
                                })
                                // ON ERROR => RESPONSE BAD REQUEST 400
                                .catch(err => res.status(400).json({ message: err.message }))
                                // DISCONNECTING TO THE DATABASE
                                .finally(() => client.release());
                        })
                        // ON ERROR => RESPONSE BAD REQUEST 400
                        .catch(err => {
                            res.status(400).json({ message: err.message });
                            // DISCONNECTING TO THE DATABASE
                            client.release();
                        })
                })
                // ON ERROR => RESPONSE BAD REQUEST 400
                .catch(err => res.status(400).json({ message: err.message }));
        },
        // CREATE A NEW USER FUNCTION => /register => post
        createUser(req, res) {
            // USER DATA
            let jsonData = req.body,
                _latLng = jsonData.coordinates.split(','),
                latLng = `${_latLng[1]} ${_latLng[0]}`;
            // CONNECTING TO THE DATABASE
            pool.connect()
            // ON SUCCESS => CONNECTED
                .then(client => {
                    // INSERT QUERY => CREATE A NEW USER
                    client.query(`INSERT INTO users (user_name, user_password, user_email, user_address, user_coordinates, geom) VALUES($1, MD5($2), $3, $4, $5, ST_GeomFromText('Point(${latLng})',4326))`, [jsonData.name, jsonData.password, jsonData.email, jsonData.address, jsonData.coordinates])
                    // ON SUCCESS => RESPONSE OK 200
                        .then(() => res.status(200).json({ title: 'Obrigado por se cadastrar', message: 'Seus dados foram cadastrados com sucesso.' }))
                        // ON ERROR => RESPONSE BAD REQUEST 400
                        .catch(err => res.status(400).json({ message: err.message }))
                        // DISCONNECTING TO THE DATABASE
                        .finally(() => client.release());
                })
                // ON ERROR => RESPONSE BAD REQUEST 400
                .catch(err => res.status(400).json({ message: err.message }));
        },
        // CHECK IF THE user_email EXISTS => /registered => post
        isRegistered(req, res) {
            // USER DATA
            let jsonData = req.body,
                // RESPONSE TEMPLATE
                respTemplate = [];
            // CONNECTING TO THE DATABASE
            pool.connect()
            // ON SUCCESS => CONNECTED
                .then(client => {
                    // SELECT QUERY => CHECK IF THE user_email EXISTS
                    client.query("SELECT * FROM users WHERE user_email = $1", [jsonData.email])
                    // ON SUCCESS
                        .then(result => {
                            // IF THE user_email NOT EXISTS
                            if (result.rowCount === 0) {
                                respTemplate.push('O e-mail informado não está cadastrado');
                            }
                            // RESPONSE OK 200
                            res.status(200).json({ respTemplate });
                        })
                        // ON ERROR => RESPONSE BAD REQUEST 400
                        .catch(err => res.status(400).json({ message: err.message }))
                        // DISCONNECTING TO THE DATABASE
                        .finally(() => client.release());
                })
                // ON ERROR => RESPONSE BAD REQUEST 400
                .catch(err => res.status(400).json({ message: err.message }));
        },
        // RECOVER USER => /recover => post
        recoverUser(req, res) {
            // USER DATA
            let jsonData = req.body,
                // RANDOM PASSWORD
                new_password = Math.random().toString(36).substring(2, 10);
            // CONNECTING TO THE DATABASE
            pool.connect()
            // ON SUCCESS => CONNECTED
                .then(client => {
                    // UPDATE QUERY => UPDATE USER PASSWORD
                    client.query("UPDATE users SET user_password = MD5($1) WHERE user_email = $2", [new_password, jsonData.email])
                    // ON SUCCESS
                        .then(() => {
                            client.query("SELECT user_name FROM users WHERE user_email = $1", [jsonData.email])
                                .then(result => {
                                    // E-MAIL OPTIONS
                                    let mailOptions = {
                                        from: 'app.petresgate@gmail.com',
                                        to: jsonData.email,
                                        subject: 'PET RESGATE - Recuperação de Cadastro',
                                        text: `Esta é uma mensagem automática por favor não responda.\n\nVocê solicitou uma recuperação de cadastro para o app PET RESGATE. Os dados cadastrados para este e-mail são:\n\nNome de usuário: ${item.user_name}\nSenha: ${new_password}\n\nAtenciosamente,\nPET RESGATE`
                                    };
                                    // E-MAIL FUNCTION
                                    transporter.sendMail(mailOptions, error => {
                                        if (error) {
                                            // ON ERROR => RESPONSE BAD REQUEST 400
                                            res.status(400).json({ message: error });
                                        } else {
                                            // RESPONSE OK 200
                                            res.status(200).json({ title: 'Por favor verifique seu e-mail', message: 'Os seus dados de cadastro foram atualizados e enviados para o seu e-mail.' });
                                        }
                                    });
                                })
                                // ON ERROR => RESPONSE BAD REQUEST 400
                                .catch(err => res.status(400).json({ message: err.message }))
                                // DISCONNECTING TO THE DATABASE
                                .finally(() => client.release());
                        })
                        // ON ERROR => RESPONSE BAD REQUEST 400
                        .catch(err => {
                            res.status(400).json({ message: err.message })
                            // DISCONNECTING TO THE DATABASE
                            client.release();
                        })
                })
                // ON ERROR => RESPONSE BAD REQUEST 400
                .catch(err => res.status(400).json({ message: err.message }))
        },
        // CHECK IF THE TOKEN IS VALID => /authenticated => get
        isAuthenticated(req, res) {
            // CONNECTING TO THE DATABASE
            pool.connect()
            // ON SUCCESS => CONNECTED
                .then(client => {
                    // SELECT QUERY
                    client.query("SELECT NOW()")
                    // ON SUCCESS
                        .then(() => res.status(200).json({ authenticated: true }))
                        // ON ERROR => RESPONSE BAD REQUEST 400
                        .catch(err => res.status(400).json({ message: err.message }))
                        // DISCONNECTING TO THE DATABASE
                        .finally(() => client.release());
                })
                // ON ERROR => RESPONSE BAD REQUEST 400
                .catch(err => res.status(400).json({ message: err.message }));
        },
        // GET USER DATA => /data:id => get
        getUser(req, res) {
            // USER ID
            let id = req.params.id,
                // RESPONSE TEMPLATE
                respTemplate = {};
            // CONNECTING TO THE DATABASE
            pool.connect()
            // ON SUCCESS => CONNECTED
                .then(client => {
                    // SELECT QUERY
                    client.query("SELECT * FROM users WHERE user_id = $1", [id])
                    // ON SUCCESS
                        .then(result => {
                            respTemplate = {
                                name: result.rows[0].user_name.trim(),
                                email: result.rows[0].user_email.trim(),
                                address: result.rows[0].user_address.trim(),
                                coordinates: result.rows[0].user_coordinates.trim()
                            };
                            // RESPONSE OK 200
                            res.status(200).json({ respTemplate });
                        })
                        // ON ERROR => RESPONSE BAD REQUEST 400
                        .catch(err => res.status(400).json({ message: err.message }))
                        // DISCONNECTING TO THE DATABASE
                        .finally(() => client.release());
                })
                // ON ERROR => RESPONSE BAD REQUEST 400
                .catch(err => res.status(400).json({ message: err.message }));
        },
        // UPDATE USER PASSWORD => /password => put
        setUserPassword(req, res) {
            // PASSWORD DATA
            let jsonData = req.body;
            // CONNECTING TO THE DATABASE
            pool.connect()
            // ON SUCCESS => CONNECTED
                .then(client => {
                    // UPDATE QUERY
                    client.query("UPDATE users SET user_password = MD5($1) WHERE user_id = $2", [jsonData.new, jsonData.id])
                    // ON SUCCESS
                        .then(() => {
                            // RESPONSE OK 200
                            res.status(200).json({ title: 'Senha atualizada', message: 'Sua senha foi atualizada com sucesso.' })
                        })
                        // ON ERROR => RESPONSE BAD REQUEST 400
                        .catch(err => res.status(400).json({ message: err.message }))
                        // DISCONNECTING TO THE DATABASE
                        .finally(() => client.release());
                })
                // ON ERROR => RESPONSE BAD REQUEST 400
                .catch(err => res.status(400).json({ message: err.message }));
        },
        // GET USER DATA => /data:user => get
        setUserData(req, res) {
            // PASSWORD DATA
            let jsonData = req.body,
                _latLng = jsonData.coordinates.split(','),
                latLng = `${_latLng[1]} ${_latLng[0]}`;
            // CONNECTING TO THE DATABASE
            pool.connect()
            // ON SUCCESS => CONNECTED
                .then(client => {
                    // UPDATE QUERY
                    client.query(`UPDATE users SET user_address = $1, user_coordinates = $2, geom = ST_GeomFromText('Point(${latLng})',4326) WHERE user_id = $3`, [jsonData.address, jsonData.coordinates, jsonData.id])
                    // ON SUCCESS
                        .then(() => {
                            // RESPONSE OK 200
                            res.status(200).json({ title: 'Dados atualizados', message: 'Seus dados foram atualizados com sucesso.' })
                        })
                        // ON ERROR => RESPONSE BAD REQUEST 400
                        .catch(err => res.status(400).json({ message: err.message }))
                        // DISCONNECTING TO THE DATABASE
                        .finally(() => client.release());
                })
                // ON ERROR => RESPONSE BAD REQUEST 400
                .catch(err => res.status(400).json({ message: err.message }));
        },
        // CREATE A NEW PET FUNCTION => /addpet => post
        createVendedor(req, res) {
            // USER DATA
            let jsonData = req.body,
                _latLng = jsonData.coordinates.split(','),
                latLng = `${_latLng[1]} ${_latLng[0]}`;
            // CONNECTING TO THE DATABASE
            pool.connect()
            // ON SUCCESS => CONNECTED
                .then(client => {
                    // INSERT QUERY => CREATE A NEW USER
                    client.query(`INSERT INTO vendedor (user_id, vendedor_name, vendedor_type, vendedor_workturn, vendedor_promo, vendedor_holiday, vendedor_description, vendedor_adress, vendedor_coordinates, vendedor_picture, vendedor_status, vendedor_date, geom) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, ST_GeomFromText('Point(${latLng})',4326))`, [jsonData.userId, jsonData.name, jsonData.type, jsonData.workturn, jsonData.promo, jsonData.holiday, jsonData.description, jsonData.address, jsonData.coordinates, jsonData.picture, jsonData.status, jsonData.date])
                    // ON SUCCESS => RESPONSE OK 200
                        .then(() => res.status(200).json({ title: 'Tudo certo!', message: 'O vendedor foi cadastrado com sucesso.' }))
                        // ON ERROR => RESPONSE BAD REQUEST 400
                        .catch(err => res.status(400).json({ message: err.message }))
                        // DISCONNECTING TO THE DATABASE
                        .finally(() => client.release());
                })
                // ON ERROR => RESPONSE BAD REQUEST 400
                .catch(err => res.status(400).json({ message: err.message }));
        },
        // GET PET DATA => /pet:id => get
        getVendedor(req, res) {
            // PET ID
            let id = req.params.id,
                // RESPONSE TEMPLATE
                respTemplate = {};
            // CONNECTING TO THE DATABASE
            pool.connect()
            // ON SUCCESS => CONNECTED
                .then(client => {
                    // SELECT QUERY
                    client.query("SELECT * FROM vendedor WHERE vendedor_id = $1", [id])
                    // ON SUCCESS
                        .then(result => {
                            respTemplate = {
                                vendedorId: result.rows[0].vendedor_id,
                                userId: result.rows[0].user_id,
                                name: result.rows[0].vendedor_name,
                                type: result.rows[0].vendedor_type,
                                workturn: result.rows[0].vendedor_workturn,
                                promo: result.rows[0].vendedor_promo,
                                holiday: result.rows[0].vendedor_holiday,
                                description: result.rows[0].vendedor_description,
                                address: result.rows[0].vendedor_address,
                                coordinates: result.rows[0].vendedor_coordinates,
                                picture: result.rows[0].vendedor_picture,
                                date: result.rows[0].vendedor_date,
                                status: result.rows[0].vendedor_status,
                                geom: result.rows[0].geom
                            };
                            // RESPONSE OK 200
                            res.status(200).json({ respTemplate });
                        })
                        // ON ERROR => RESPONSE BAD REQUEST 400
                        .catch(err => res.status(400).json({ message: err.message }))
                        // DISCONNECTING TO THE DATABASE
                        .finally(() => client.release());
                })
                // ON ERROR => RESPONSE BAD REQUEST 400
                .catch(err => res.status(400).json({ message: err.message }));
        },
        // GET PETS DATA => /pets => get
        getVendedores(req, res) {
            // RESPONSE TEMPLATE
            let respTemplate = [];
            // CONNECTING TO THE DATABASE
            pool.connect()
            // ON SUCCESS => CONNECTED
                .then(client => {
                    // SELECT QUERY
                    client.query("SELECT * FROM vendedor WHERE vendedor_status[1] = 0 ORDER BY vendedor_id")
                    // ON SUCCESS
                        .then(result => {
                            result.rows.map(item => {
                                respTemplate.push({
                                    vendedorId: item.vendedor_id,
                                    userId: item.user_id,
                                    name: item.vendedor_name,
                                    type: item.vendedor_type,
                                    workturn: item.vendedor_workturn,
                                    promo: item.vendedor_promo,
                                    holiday: item.vendedor_holiday,
                                    description: item.vendedor_description,
                                    address: item.vendedor_address,
                                    coordinates: item.vendedor_coordinates,
                                    picture: item.vendedor_picture,
                                    date: item.vendedor_date,
                                    status: item.vendedor_status,
                                    geom: item.geom,
                                });
                            });
                            // RESPONSE OK 200
                            res.status(200).json({ respTemplate });
                        })
                        // ON ERROR => RESPONSE BAD REQUEST 400
                        .catch(err => res.status(400).json({ message: err.message }))
                        // DISCONNECTING TO THE DATABASE
                        .finally(() => client.release());
                })
                // ON ERROR => RESPONSE BAD REQUEST 400
                .catch(err => res.status(400).json({ message: err.message }));
        },
        // UPDATE PET STATUS => /rescue => put
        rescue(req, res) {
            // DATA
            let jsonData = req.body;
            // CONNECTING TO THE DATABASE
            pool.connect()
            // ON SUCCESS => CONNECTED
                .then(client => {
                    // UPDATE QUERY
                    client.query("UPDATE vendedor SET vendedor_status = $1 WHERE vendedor_id = $2", [jsonData.status, jsonData.vendedorId])
                    // ON SUCCESS
                        .then(() => {
                            // RESPONSE OK 200
                            res.status(200).json({ title: 'Resgate', message: 'O resgate do animal foi registrado com sucesso, muito obrigado por ajudar.' })
                        })
                        // ON ERROR => RESPONSE BAD REQUEST 400
                        .catch(err => res.status(400).json({ message: err.message }))
                        // DISCONNECTING TO THE DATABASE
                        .finally(() => client.release());
                })
                // ON ERROR => RESPONSE BAD REQUEST 400
                .catch(err => res.status(400).json({ message: err.message }));
        },
        // FILTER vendedorS => /filter => post
        filter(req, res) {
            // USER DATA
            let jsonData = req.body,
                _latLng = jsonData.coordinates.split(','),
                latLng = `${_latLng[1]} ${_latLng[0]}`,
                // RESPONSE TEMPLATE
                respTemplate = [];
            // CONNECTING TO THE DATABASE
            pool.connect()
            // ON SUCCESS => CONNECTED
                .then(client => {
                    // INSERT QUERY => CREATE A NEW USER
                    client.query(`SELECT * FROM vendedor WHERE vendedor_type[1] = 0 AND ST_Intersects(geom,ST_Buffer(ST_GeomFromText('Point(${latLng})',4326),$1))`, [jsonData.distance, jsonData.type])
                    // ON SUCCESS
                        .then(result => {
                            result.rows.map(item => {
                                respTemplate.push({
                                    vendedorId: item.vendedor_id,
                                    name: item.vendedor_name.trim(),
                                    type: item.vendedor_type.trim(),
                                    workturn: item.vendedor_workturn.trim(),
                                    promo: item.vendedor_promo,
                                    holiday: item.vendedor_holiday,
                                    description: item.vendedor_description.trim(),
                                    address: item.vendedor_address.trim(),
                                    coordinates: item.vendedor_coordinates.trim(),
                                    picture: item.vendedor_picture,
                                    date: item.vendedor_date,
                                    status: item.vendedor_status,
                                    geom: item.geom,
                                });
                            });
                            // RESPONSE OK 200
                            res.status(200).json({ respTemplate });
                        })
                        // ON ERROR => RESPONSE BAD REQUEST 400
                        .catch(err => res.status(400).json({ message: err.message }))
                        // DISCONNECTING TO THE DATABASE
                        .finally(() => client.release());
                })
                // ON ERROR => RESPONSE BAD REQUEST 400
                .catch(err => res.status(400).json({ message: err.message }));
        }
    };

    return controller;
};