import { getStringifier } from "@/services/stringify"
import statemachine from "@/statemachine"
import { regescape } from "@/util"
import { Lemgram } from "@/lemgram"
import { locObj } from "@/i18n"

import { findContextWords } from "custom/util"


export default {
    complemgram: {
        template: String.raw`
            <span ng-if="value == '|'" class="opacity-50">&empty;</span>
            <ul ng-show="value != '|'">
                <li ng-repeat="comp in values | limitTo:listLimit">
                    <span ng-repeat="value in comp.split('+') track by $index">
                        <span ng-if="!$first"> + </span>
                        <a ng-click="onItemClick(value)" ng-bind-html="stringify(value) | trust"></a>
                    </span>
                </li>
                <li class="link" ng-show="values.length > 1" ng-click="listLimit = listLimit < 10 ? 10 : 1">
                    {{listLimit < 10 ? 'complemgram_show_all': 'complemgram_show_one' | loc:$root.lang}} ({{values.length - 1}})
                </li>
            </ul>
        `,
        controller: ["$location", "$scope", function($location, $scope) {
            $scope.listLimit = 1
            $scope.stringify = (lemgram) => Lemgram.parse(lemgram)?.toHtml() || lemgram
            $scope.values = $scope.value.split("|").filter(Boolean).map((item) => item.replace(/:.*$/, ""))
            $scope.onItemClick = (value) => {
                statemachine.send("SEARCH_LEMGRAM", { value })
                $location.search("prefix", true)
                $location.search("suffix", true)
            }
        }]
    },

    // Video player link for for showing the video popup, to show a
    // video based on attribute values
    //
    // options is an object containing (some of) the following
    // properties:
    // - label: localizable label for the video link; default: "show_video_korp"
    // - baseURL: base URL for the video
    // - startTime: start time of the video in milliseconds
    // - endTime: end time of the video in milliseconds
    // - path: path of the video file, appended to baseURL
    // - file: filename of the video file, appended to baseURL + path
    // - ext: extension of the video file (without the leading dot)
    // - height: video height (percentage or "auto"); default: "auto"
    // - width: video width (percentage or "auto"); default: "auto"
    // - videoType: video type (appended to "video/"); default: "mp4"
    // - sentence: the sentence (text) to show in the video popup;
    //   default: the word forms of the current sentence
    //
    // If file and ext are empty, path is considered to contain them;
    // if path is also empty, baseURL is considered to contain them.
    //
    // If the value of some of these options (except label) begins
    // with an "@", the rest of the value is the name of the
    // (structural) attribute from which to get the actual value;
    // otherwise, the value is used as a constant value as such.
    //
    // Adapted and generalized from Språkbanken's ivipVideo
    videoPlayer: (options) => ({
        template: String.raw`
            <span class="link" ng-click="showVideoModal()">{{label | loc:$root.lang}}</span>
            <div id="video-modal" ng-controller="VideoCtrl"></div>
        `,
        controller: ["$scope", function($scope) {
            // Get a value: if value begins with an "@", return the
            // value of the structural attribute whose name follows
            // the "@"; otherwise, return value as is ("" for
            // undefined)
            const getValue = function (value) {
                return ((value || "").startsWith("@")
                        ? $scope.sentenceData[value.slice(1)]
                        : value || "")
            };
            const baseURL = getValue(options.baseURL)
            const startTime = getValue(options.startTime)
            const endTime = getValue(options.endTime)
            const path = getValue(options.path)
            const file = getValue(options.file)
            const ext = getValue(options.ext)
            const videoType = getValue(options.videoType) || "mp4"
            const height = getValue(options.height) || "auto"
            const width = getValue(options.width) || "auto"
            const sentence = getValue(options.sentence)
            $scope.label = getValue(options.label) || "show_video_korp"
            // console.log("videoPlayer controller", $scope.sentenceData,
            //             baseURL, startTime, endTime, path, file, ext)

            $scope.showVideoModal = function () {
                const url = baseURL + path + file + (ext ? "." + ext : "")
                const modalScope = angular.element("#video-modal").scope()
                modalScope.videos = [{"url": url, "type": "video/" + videoType}]
                modalScope.fileName = (file
                                       ? file + "." + ext
                                       : url.split("/").slice(-1)[0])
                modalScope.startTime = startTime / 1000
                modalScope.endTime = endTime / 1000
                modalScope.height = height
                modalScope.width = width
                // console.log("videoLink", modalScope.videos,
                //             modalScope.fileName, modalScope.startTime,
                //             modalScope.endTime)
                if (sentence) {
                    modalScope.sentence = sentence
                } else {
                    // find start of sentence
                    let startIdx = 0
                    for (let i = $scope.wordData.position; i >= 0; i--) {
                        if (_.includes($scope.tokens[i]._open, "sentence")) {
                            startIdx = i
                            break
                        }
                    }
                    // find end of sentence
                    let endIdx = $scope.tokens.length - 1
                    for (let i = $scope.wordData.position; i <= endIdx; i++) {
                        if (_.includes($scope.tokens[i]._close, "sentence")) {
                            endIdx = i
                            break
                        }
                    }
                    modalScope.sentence =
                        _.map($scope.tokens.slice(startIdx, endIdx + 1),
                              "word").join(" ")
                }
                modalScope.open()
            }
        }]
    }),

    lsiImage: {
        template: String.raw`
            <div>
                <a target="_blank" ng-href="{{pageUrl}}" ng-show="pageUrl">
                    <img ng-src="https://spraakbanken.gu.se/korp/data/lsi/faksimil_thumb/thumb.lsi-v{{volumeName}}-{{pageNumber2}}.jpg">
                </a>
            </div>
        `,
        controller: ["$scope", function($scope) {
            $scope.pageUrl = $scope.sentenceData["page_page_url"]
            const re = new RegExp("volume=(.*-.*)&pages=.*#page/(.*)/mode")
            const matches = $scope.pageUrl.match(re)
            $scope.volumeName = matches[1]
            const pageNumber = matches[2]
            $scope.pageNumber2 = ("00"+pageNumber).slice(-3)
        }]
    },
    expandList: (options = {}) => ({
        template: `
        <span ng-if="value == '|'" class="opacity-50">&empty;</span>
        <ul ng-if="value != '|'">
            <li ng-repeat="value in values | limitTo:listLimit">
                <span 
                    ng-class="{link: internalSearch}"
                    title="{{ value.prob }}"
                    ng-bind-html="stringify(value.value) | trust"
                    ng-click="internalSearch && onItemClick(value.value)"></span>
                <a
                    ng-if="attrs.external_search"
                    ng-href="{{ externalLink(value.value) }}"
                    class="external_link"
                    target="_blank"
                    style="margin-top: -6px"></a>
            </li>
        </ul>
        <span class="link" ng-show="values.length > 1 && !showAll" ng-click="listLimit = listLimit != $scope.values.length ? $scope.values.length : 1">
            {{listLimit != $scope.values.length ? 'complemgram_show_all': 'complemgram_show_one' | loc:$root.lang}} ({{values.length - 1}})
        </span>
        `,
        controller: ["$scope", function($scope) {
            let valueArray = _.filter(($scope.value && $scope.value.split("|")) || [], Boolean)

            if ($scope.attrs.ranked) {
                $scope.values = _.map(valueArray, (value) => {
                    // TODO is this correct? should we not split at the last occurrence of ":"
                    const val = value.split(":")
                    return { value: val[0], prob: val[val.length - 1] }
                })
            } else {
                $scope.values = _.map(valueArray, (value) => ({ value: value }))
            }

            $scope.listLimit = options.show_all ? $scope.values.length : 1

            $scope.showAll = options.show_all
            $scope.internalSearch = options.internal_search

            $scope.stringify = getStringifier($scope.key)

            const op = options.op ? options.op : "contains"

            $scope.onItemClick = (value) => {
                const cqp = `[${$scope.type == 'struct' ? '_.' : ''}${$scope.key} ${op} "${regescape(value)}"]`;
                statemachine.send("SEARCH_CQP", {cqp})
            }
 
            if ($scope.attrs.external_search) {
                $scope.externalLink = (value) => {
                    return _.template($scope.attrs.external_search)({
                        val: value,
                    })
                }
            }
       }]
    }),
    copyRowButton: (options = {}) => ({
        template: `<span class="cursor-pointer" ng-click="click()"><i class="fa-solid fa-copy"></i> {{ 'copy_row' | loc:$root.lang }}</span>`,
        controller: ["$scope", function($scope) {
            $scope.click = () => {
                const copyStr = _.map(options["attributes"] || ["word"], (attribute) =>
                _.map($scope.tokens, (token) => token[attribute] || $scope.sentenceData[attribute]).join("\t")
                ).join("\n")
                navigator.clipboard.writeText(copyStr)
            }
       }]
    }),

    // Link to a KLK page image (custom attribute). options.context
    // can be set to specify the context size (number of tokens)
    // (default: 0).
    klkPageImageLink: (options = {}) => ({
        template: String.raw`<span>
            <a ng-href="{{ makeKlkPageImageUrl({sentenceData, wordData, tokens}, context) }}" class="exturl sidebar_link" target="_blank">{{ label }}</a>
        </span>`,
        controller: ["$scope", function ($scope) {
            $scope.makeKlkPageImageUrl = makeKlkPageImageUrl
            $scope.context = options.context ?? 0
            $scope.label = locObj($scope.attrs.label)
        }],
    }),

    // Link to KLK PDF download (custom attribute).
    klkDownloadPdfLink: {
        template: String.raw`<span>
            <a ng-href="{{ makeKlkUrlBase(sentenceData) }}/pdf" class="exturl sidebar_link" target="_blank">{{ label }}</a>
        </span>`,
        controller: ["$scope", function ($scope) {
            $scope.makeKlkUrlBase = makeKlkUrlBase
            $scope.label = locObj($scope.attrs.label)
        }],
    },

}


// Internal functions

// Return a KLK URL base for a publication with sentenceData.
function makeKlkUrlBase (sentenceData) {
    return ("http://digi.kansalliskirjasto.fi/"
            + sentenceData.text_publ_type
            + "/binding/"
            + sentenceData.text_binding_id)
}

// Return a KLK page image URL for a token with tokenData (containing
// at least wordData, sentenceData and tokens), with context of
// contextSize tokens.
function makeKlkPageImageUrl (tokenData, contextSize) {
    const words = findContextWords(tokenData, contextSize)
    return (makeKlkUrlBase(tokenData.sentenceData)
            + "?page=" + tokenData.sentenceData.text_page_no)
            + (words ? "&term=" + words : "")
}
