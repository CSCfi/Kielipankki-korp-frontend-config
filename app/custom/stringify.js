import { Lemgram } from "@/lemgram"
import { Saldo } from "@/saldo"

import { makeLinkIso639_3 } from "custom/util"


export default {
    sense: (sense) => Saldo.parse(sense).toHtml() || sense,
    lemgram: (str) => Lemgram.parse(str)?.toHtml() || str,
    complemgram: (str) => str.split('+').map((s) => Lemgram.parse(s)?.toHtml() || s).join('+'),
    lemma: (str) => str.replace(/_/g, " ").replace(/:\d+$/g, ""),

    // Stringify ISO 639-3 language code lang as a link to the SIL
    // page for the language.
    langLink: (lang) => makeLinkIso639_3(lang),

    // Stringify value val consisting of an ISO 639-3 language code
    // followed by a colon and a number (count) so that the language
    // code is a link to the SIL page for the language and a space is
    // inserted after the colon.
    sumLangLink: function (val) {
        const [lang, count] = val.split(":")
        return `<span>${makeLinkIso639_3(lang)}: ${count}</span>`
    },

}
