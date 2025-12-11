import settings from "@/settings"
import { getService } from "@/angular-util";
const minkImgPath = require("custom/mink.svg")

settings["auth_module"] = {
    module: "federated_auth",
    options: {
        jwt_url: "https://www.kielipankki.fi/secure/auth/jwt",
        login_service: "https://www.kielipankki.fi/secure/auth/login",
        logout_service: "https://www.kielipankki.fi/secure/auth/logout",
    },
}

settings["corpus_info_link"] = {
    url_template: "https://www.kielipankki.fi/future/mink/library/corpus/%s",
    label: {
        fin: "Avaa Minkissä",
        swe: "Öppna i Mink",
        eng: "Open in Mink",
    }
}
settings["frontpage"]["corpus_updates"] = false
settings["korp_backend_url"] = "https://www.kielipankki.fi/future/korp/api8"
settings["map_enabled"] = true

settings["config_dependent_on_authentication"] = true

settings["get_corpus_ids"] = async () => {
    const {auth} = await import("@/auth/auth")
    if (!auth.isLoggedIn()) return undefined
    // Fetch user's corpus ids from Mink
    const minkUrl = "https://www.kielipankki.fi/future/mink/api"
    const conf = {headers: auth.getAuthorizationHeader()}
    const response = await fetch(`${minkUrl}/list-korp-corpora`, conf)
    const data = await response.json()
    return data.corpora
}

let html = String.raw

const minkLink = "https://www.kielipankki.fi/future/mink/"

settings["initialization_checks"] = async () => {
    // Import only when needed, because it depends on the auth_module setting defined here
    const {default: statemachine} = await import("@/statemachine")
    const {auth} = await import("@/auth/auth")

    const translations = {
        readMore: {
            fin: "Lue lisää Minkistä",
            eng: "Read more about Mink",
            swe: "Läs mer om Mink",
        },
        here: {
            fin: "täältä",
            eng: "here",
            swe: "här"
        },
        notAuthenticated: {
            fin: "Tämä on Korpin Mink-osasto. Tätä osastoa voivat käyttää vain kirjautuneet käyttäjät, joilla on pääsy Minkiin.",
            eng: "This is the Mink mode in Korp. Only logged in users with access to Mink can use this mode.",
            swe: "Det här är Mink-läget i Korp. Bara inloggande användare kan använda det här läget.",
        },
        login: {
            fin: "Haluatko kirjautua?",
            eng: "Do you want to log in?",
            swe: "Vill du logga in?",
        },
        noCorpora: {
            fin: "Tämä on Korpin Mink-osasto. Sinulla ei ole aineistoja tutkittavana.",
            eng: "This is the Mink mode in Korp. You do not have any corpora to explore.",
            swe: "Det här är Mink-läget i Korp. Du har inga korpusar att undersöka.",
        },
        goTo: {
            fin: "Jos haluat luoda omia aineistojasi, mene",
            eng: "If you want to create your own corpora, go to",
            swe: "Om du vill skapa dina egna korpusar, gå till",
        },
    }

    function openModal(template) {
        const $uibModal = getService("$uibModal");
        const $rootScope = getService("$rootScope")
        const scope = $rootScope.$new();
        scope.translations = translations;
        return $uibModal.open({
            template,
            scope,
            backdrop: "static",
            keyboard: false,
        });
    }

    if (!auth.isLoggedIn()) {
        const modal = openModal(html`<div class="modal-body">
                <div class="text-center my-5"><img src="${minkImgPath}" class="h-16" /></div>
                <div class="my-3">{{translations.notAuthenticated | locObj:$root.lang}}</div>
                <div>
                    {{translations.readMore | locObj:$root.lang}}
                    <a href="${minkLink}">{{translations.here | locObj:$root.lang}}</a>.
                </div>
                <div class="mt-3">{{translations.login | locObj:$root.lang}}</div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" ng-click="$close()">{{'log_in' | loc:$root.lang}}</button>
            </div>`);
        modal.result.finally(() => {
            statemachine.send("LOGIN_NEEDED");
        });
        return true;
    } else if (_.isEmpty(settings["corpora"])) {
        openModal(html`<div class="modal-body">
            <div class="text-center my-5"><img src="${minkImgPath}" class="h-16" /></div>
            <div class="my-5">{{translations.noCorpora | locObj:$root.lang}}</div>
            <div class="my-5">{{translations.goTo | locObj:$root.lang}} <a href="${minkLink}">Mink</a></div>
        </div>`);
        return true;
    }
    return false
}

settings["description"] = {
    fin: html`<div class="mt-3">
        <img src="${minkImgPath}" class="block h-32 my-5 mx-auto" />
        <div class="text-lg">
            <div class="mt-2">Tämä on Korpin Mink-osasto.</div>
            <div class="mt-2">
                Täällä voit hakea aineistoista, jotka olet vienyt ja
                asentanut Minkin kautta. Kaikki aineistot tässä
                osastossa ovat yksityisiä: vain sinä voit nähdä ne.
            </div>
            <div class="mt-2">Klikkaa yllä olevaa korpusvalikkoa
            valitaksesi aineistoja.</div>
            <div class="mt-2">Lue lisää Minkistä <a href="${minkLink}">täältä</a>.</div>
        </div>
    </div>`,
    swe: html`<div class="mt-3">
        <img src="${minkImgPath}" class="block h-32 my-5 mx-auto" />
        <div class="text-lg">
            <div class="mt-2">Det här är Mink-läget i Korp.</div>
            <div class="mt-2">
                Här kan du söka i de korpusar som du har laddat upp och installerat via Mink. Alla korpusar i läget är
                privata och kan endast ses av dig.
            </div>
            <div class="mt-2">Klicka i korpusväljaren ovanför för att göra ditt materialurval.</div>
            <div class="mt-2">Läs mer om Mink <a href="${minkLink}">här</a>.</div>
        </div>
    </div>`,
    eng: html`<div class="mt-3">
        <img src="${minkImgPath}" class="block h-32 my-5 mx-auto" />
        <div class="text-lg">
            <div class="mt-2">This is the Mink mode in Korp.</div>
            <div class="mt-2">
                Here you can search in the corpora that you have uploaded and installed with Mink. All corpora in this
                mode are private and can only be seen by you.
            </div>
            <div class="mt-2">Click in the corpus chooser above to make your corpus selection.</div>
            <div class="mt-2">Read more about Mink <a href="${minkLink}">here</a>.</div>
        </div>
    </div>`,
}

// settings["frontpage"]["examples"] = [
//     {
//         label: {
//             swe: "Alla adjektiv",
//             eng: "All adjectives",
//         },
//         params: {
//             search: "cqp",
//             cqp: '[pos = "JJ"]',
//             search_tab: 1,
//         },
//     },
//     {
//         label: {
//             swe: "Fördelning över olika verb",
//             eng: "Distribution of different verbs",
//         },
//         params: {
//             search: "cqp",
//             cqp: '[pos = "VB"]',
//             search_tab: 1,
//             stats_reduce: "word,lemma",
//             result_tab: 2,
//         },
//     },
//     {
//         label: {
//             swe: 'Verb följt av "inte"',
//             eng: 'Verbs followed by "inte" ("not")',
//         },
//         params: {
//             search: "cqp",
//             cqp: '[pos = "VB"] [word = "inte" %c]',
//             search_tab: 1,
//         },
//     },
//     {
//         label: {
//             swe: 'Ordbild för "jobb"',
//             eng: 'Word picture for "jobb" ("work")',
//         },
//         params: {
//             search: "lemgram|jobb..nn.1",
//             result_tab: 3,
//         },
//     },
//   ]
