/*
 * Copyright (c) 2016 Mats & Myles
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}
String.prototype.formatArg = function (args) {
    return this.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};

// TODO MAKE THIS WHOLE PART BETTER, I COPIED THIS FROM THE PROTOTYPE.
var web = {
    isHidden: false,
    registerListeners: function () {
        $('#compare').click(function () {
            var compare = $("#compare");
            compare.html("<span class=\"glyphicon glyphicon-refresh glyphicon-refresh-animate\"></span> Compare versions"); // TODO FIND A BETTER WAY FOR THIS
            compare.prop("disabled", true);

            var oldV = $("#old").find('option:selected').val();
            var newV = $("#new").find('option:selected').val();

            dataHandler.requestCompare(oldV, newV);
        })
    },
    addInfo: function (oldVersion, newVersion) {
        var title = "<strong>INFORMATION</strong>";
        var template = "<strong>Minecraft Version: </strong>{0} <br/> \
        <strong>Version Type: </strong>{1} <br/> \
        <strong>Version release time: </strong>{2} <br/> \
        <strong>Protocol id: </strong><span id={3}>Unknown</span>";

        this.addHtml
        (title,
            template.format(oldVersion.id, oldVersion.type, oldVersion.releaseTime, "pidOld"),
            title,
            template.format(newVersion.id, newVersion.type, newVersion.releaseTime, "pidNew"));
    },
    addPacket: function (oldVersion, newVersion) {
        this.addHtml(
            this.getPacketTitle(oldVersion),
            htmlParser.getInstructions(oldVersion.instructions, 0),
            this.getPacketTitle(newVersion),
            htmlParser.getInstructions(newVersion.instructions, 0)
        );
    },
    getPacketTitle: function (packet) {
        console.log(packet);
        return "<strong>" + packet.state + ": </strong><ins>" + packet.id + "</ins> (" + packet.class + ") - " + packet.direction
    },
    setProtocolId: function (oldId, newId) {
        $("#pidOld").html(oldId);
        $("#pidNew").html(newId);
    },
    addHtml: function (title, footer, newTitle, newFooter) {
        $("#data")
            .append("<div class=\"row\">"
                + "   <div class=\"col-md-6\">"
                + "       <div class=\"panel panel-danger\">"
                + "           <div class=\"panel-heading\">" + title + "</div>"
                + "           <div class=\"panel-footer code\">" + footer + "</div>"
                + "       </div>"
                + "    </div>"
                + "   <div class=\"col-md-6\">"
                + "       <div class=\"panel panel-success\">"
                + "           <div class=\"panel-heading\">" + newTitle + "</div>"
                + "           <div class=\"panel-footer code\">" + newFooter + "</div>"
                + "       </div>"
                + "    </div>");
    }
};

var dataHandler = {
    requestCompare: function (oldV, newV) {
        $.ajax({
            dataType: "json",
            type: "GET",
            url: "./v1/compare",
            data: {"old": oldV, "new": newV},
            success: function (json) {
                moduleManager.execute(json);
            },
            error: function (err) {
                console.log(err);
            }
        });
    }
};

var moduleManager = {
    modules: {},
    on: function (name, func) {
        console.log("register module " + name);
        moduleManager.modules[name] = func;
    },

    execute: function (json) {
        // console.log(JSON.stringify(data));

        Object.keys(json.oldVersion).forEach(function (key, index) {
            console.log(key + " " + moduleManager.modules);
            if (!moduleManager.modules.hasOwnProperty(key))
                console.error("No module found " + key + " [" + JSON.stringify({}) + "]");
            else
                moduleManager.modules[key](json.oldVersion[key], json.newVersion[key]);
        });

        web.isHidden = true;
        $("#beginModal").modal("hide");
    }
};

function registerModules() {
    // info about the jar
    moduleManager.on("JarModule", function (oldV, newV) {
        console.log(oldV);
        console.log(newV);
        web.addInfo(oldV, newV);
    });

    moduleManager.on("BurgerModule", function (oldV, newV) {
        web.setProtocolId(oldV.protocol, newV.protocol);
        Object.keys(oldV.changedPackets).forEach(function (key, index) {
            web.addPacket(oldV.changedPackets[key], newV.changedPackets[key]);
        });
    })

    //TODO METADATA
    moduleManager.on("MetadataModule", function (oldV, newV) {

    })
}
$(document).ready(function () {
    web.registerListeners();
    registerModules();

    $('#beginModal').modal('show').on('hide.bs.modal', function (e) {
        if (web.isHidden)
            return;
        e.preventDefault();
    });

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
        $('.selectpicker').selectpicker('mobile');
    }
});
