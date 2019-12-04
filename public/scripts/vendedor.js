(() => {
    'use strict'

    let com_canvas = document.getElementById('vendedor_frame'),
        ctx = com_canvas.getContext("2d"),
        can_width = 180,
        can_height = 130,
        // HELP BUTTON
        btn_help = document.getElementById('app_help'),
        // RESCUE BUTTON
        btn_rescue = document.getElementById('app_rescue'),
        // RETURN BUTTON
        btn_return = document.getElementById('app_return'),
        // DIALOG
        dialog = document.getElementById('app_dialog'),
        // SNACKBAR
        snackbar = document.getElementById('app_snackbar'),
        // SPINNER
        spinner = document.getElementById('app_loading'),
        vendedor_description = document.getElementById('vendedor_description');
    const formatDate = date => {
        let splitted = date.split('T')
        splitted[0] = splitted[0].split('-').reverse().join('/')
        splitted[1] = splitted[1].substr(0,8)
        return splitted.join(' - ')
    };
    // WINDOW EVENT TO CHECK AUTHENTICATION
    window.addEventListener('load', () => {
        // CHECK ONLINE STATE
        if (navigator.onLine) {
            // CHECK LOCALSTORAGE auth
            if (localStorage.hasOwnProperty('auth')) {
                let str_auth = localStorage.getItem('auth'),
                    obj_auth = JSON.parse(str_auth);
                appShowLoading(spinner, spinner.children[0]);
                // NODE.JS API isAuthenticated
                fetch('/authenticated', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${obj_auth.token}`
                    }
                })
                    .then(result => { return result.json() })
                    .then(data => {
                        if (!data.authenticated) {
                            window.location = 'index.html';
                        }
                    })
                    .catch(err => {
                        console.error(err.message);
                        window.location = 'index.html';
                    });
                if (localStorage.hasOwnProperty('vendedor')) {
                    let str_vendedor = localStorage.getItem('vendedor'),
                        obj_vendedor = JSON.parse(str_vendedor);
                    // NODE.JS API getvendedor
                    fetch(`/vendedor/${obj_vendedor.id}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${obj_auth.token}`
                        }
                    })
                        .then(result => { return result.json() })
                        .then(data => {
                            console.log(data)
                            // DATA ARRAYBUFFER TO BASE 64 STRING
                            let base64String = String.fromCharCode.apply(null, new Uint16Array(data.respTemplate.picture.data)),
                                vendedor_date = formatDate(data.respTemplate.date),
                                template = null,
                                // CREATES A IMAGE
                                img = new Image();
                            img.src = base64String;
                            // RESIZE THE IMAGE
                            img.onload = () => {
                                ctx.clearRect(0, 0, can_width, can_height);
                                com_canvas.width = can_width;
                                com_canvas.height = can_height;
                                // DRAW THE IMAGE ON CANVAS
                                ctx.drawImage(img, 0, 0, can_width, can_height);
                            },
                                img.onerror = err => console.error(err.message);

                            template = `<strong>Nome:</strong> ${data.respTemplate.name}<br><br>
                            <strong>Produtos:</strong> ${data.respTemplate.type}<br><br>
                            <strong>Data de Cadastro:</strong>  ${(vendedor_date).substr(0,vendedor_date.length - 3)}<br><br>
                            <strong>Tem Promoção ?</strong> ${data.respTemplate.promo ? 'Sim' : 'Não'}<br><br>
                            <strong>Trabalha nos Feriados ?</strong> ${data.respTemplate.holiday ? 'Sim' : 'Não'}<br><br>
                            <strong>Turnos :</strong> ${data.respTemplate.workturn}<br><br>                        
                            <strong>Localização:</strong> ${data.respTemplate.coordinates}<br><br>
                            <strong>Descrição:</strong> ${data.respTemplate.description}`;

                            vendedor_description.innerHTML = template;
                            appHideLoading(spinner, spinner.children[0]);

                        })
                        .catch(err => {
                            console.error(err.message);
                            appShowLoading(spinner, spinner.children[0]);
                            appShowSnackBar(snackbar, 'Ocorreu um erro, por favor tente novamente');
                        })
                }
                else {
                    window.location = 'index.html';
                }
            }
            else {
                window.location = 'index.html';
            }
        }
        else {
            window.location = 'index.html';
        }
    });

    // HELP EVENT
    btn_help.addEventListener('click', () => {
        appShowDialog({
            element: dialog,
            title: 'Ajuda',
            message: 'Favor verificar as informações do animal e se você for ajudar o mesmo, favor clicar no ícone de coração RESGATAR. Por favor só realize está operação se você realmente for ajudar o animal, pois ao fazer isso o mesmo será removido do banco de dados.',
            btn_ok() { appHideDialog(dialog); }
        });
    });

    // RETURN EVENT
    btn_return.addEventListener('click', () => {
        window.location = 'map.html';
    });

    // RESCUE EVENT
    btn_rescue.addEventListener('click', () => {
        // CHECK ONLINE STATE
        if (navigator.onLine) {
            appShowDialog({
                element: dialog,
                title: 'Resgate',
                message: 'Por favor prossiga clicando em SIM para informar que você vai resgatar este animal. Realize esta operação somente se você realmente for resgatar o animal, pois ao fazer esta operação, o animal será removido do banco de dados impossibilitando que outras pessoas consigam ajudá-lo.',
                btn_no() { appHideDialog(dialog); },
                btn_yes() {
                    let str_auth = localStorage.getItem('auth'),
                        obj_auth = JSON.parse(str_auth),
                        str_vendedor = localStorage.getItem('vendedor'),
                        obj_vendedor = JSON.parse(str_vendedor),
                        rescue = {
                            status: [1, obj_auth.id],
                            vendedorId: obj_vendedor.id
                        };
                    appShowLoading(spinner, spinner.children[0]);
                    // NODE.JS API rescue
                    fetch('/rescue', {
                        method: 'PUT',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${obj_auth.token}`
                        },
                        body: JSON.stringify(rescue)
                    })
                        .then(result => { return result.json() })
                        .then(data => {
                            appHideLoading(spinner, spinner.children[0]);
                            appShowDialog({
                                element: dialog,
                                title: data.title,
                                message: data.message,
                                btn_ok() { window.location = 'map.html' }
                            });
                        })
                        .catch(err => {
                            console.error(err.message);
                            appHideLoading(spinner, spinner.children[0]);
                            appShowSnackBar(snackbar, 'Ocorreu um erro, por favor tente novamente');
                        });
                }
            });
        }
        else {
            appShowSnackBar(snackbar, 'Sem internet');
        }
    });
})();
