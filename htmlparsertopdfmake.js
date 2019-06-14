/* inspired by
 https://github.com/bpampuch/pdfmake/issues/205
 http://jsfiddle.net/mychn9bo/4/
 */

function ParseContainer(cnt, e, p, styles) {
    var elements = [];
    var children = e.childNodes;
    if (children.length != 0) {
        for (var i = 0; i < children.length; i++) p = ParseElement(elements, children[i], p, styles);
    }
    if (elements.length != 0) {
        for (var i = 0; i < elements.length; i++) cnt.push(elements[i]);
    }
    return p;
}

function ComputeStyle(o, styles) {
    for (var i = 0; i < styles.length; i++) {
        var st = styles[i].trim().toLowerCase().split(":");
        if (st.length == 2) {
            switch (st[0]) {
                case "font-size": {
                    o.fontSize = parseInt(st[1]);
                    break;
                }
                case "text-align": {
                    switch (st[1]) {
                        case "right": o.alignment = 'right'; break;
                        case "center": o.alignment = 'center'; break;
                    }
                    break;
                }
                case "font-weight": {
                    switch (st[1]) {
                        case "bold": o.bold = true; break;
                    }
                    break;
                }
                case "text-decoration": {
                    switch (st[1]) {
                        case "underline": o.decoration = "underline"; break;
                    }
                    break;
                }
                case "font-style": {
                    switch (st[1]) {
                        case "italic": o.italics = true; break;
                    }
                    break;
                }
                case "background": {
                    o.background = st[1];
                    break;
                }
                case "font-color": {
                    o.color = st[1];
                    break;
                }
                case "width": {
                    o.width = st[1];
                    break;
                }
                case "fillColor": {
                    o.fillColor = st[1];
                    break;
                }
                case "padding": {
                    o.padding = st[1];
                    break;
                }
            }
        }
    }
}

function ParseElement(cnt, e, p, styles) {
    if (!styles) styles = [];
    if (e.getAttribute) {
        var nodeStyle = e.getAttribute("style");
        if (nodeStyle) {
            var ns = nodeStyle.split(";");
            for (var k = 0; k < ns.length; k++) styles.push(ns[k]);
        } else {
            classStyle = e.getAttribute("class");
            if (classStyle) {
                var cs = classStyle.split(" ");
            }
        }
    }

    switch (e.nodeName.toLowerCase()) {
        case "#text": {
            var t = { text: e.textContent.replace(/\n/g, "") };
            if (styles) ComputeStyle(t, styles);
            p.text.push(t);
            if (cs && cs.length > 0) {
                for (var index = 0; index < cs.length; index++) {
                    p["style"] = cs[index];
                }
            }
            break;
        }
        case "b": case "strong": {
            //styles.push("font-weight:bold");
            ParseContainer(cnt, e, p, styles.concat(["font-weight:bold"]));
            break;
        }
        case "u": {
            //styles.push("text-decoration:underline");
            ParseContainer(cnt, e, p, styles.concat(["text-decoration:underline"]));
            break;
        }
        case "i": {
            //styles.push("font-style:italic");
            ParseContainer(cnt, e, p, styles.concat(["font-style:italic"]));
            //styles.pop();
            break;
            //cnt.push({ text: e.innerText, bold: false });
        }
        case "span": {
            ParseContainer(cnt, e, p, styles);
            if (cs && cs.length > 0) {
                for (var index = 0; index < cs.length; index++) {
                    p["style"] = cs[index];
                }
            }
            break;
        }
        case "br": {
            p = CreateParagraph();
            cnt.push(p);
            break;
        }
        case "table":
            {
                var tableClass = e.getAttribute("class");
                var t = {
                    style: tableClass,
                    table: {
                        widths: [],
                        body: []
                    }
                }

                var border = e.getAttribute("border");
                var isBorder = false;
                if (border) if (parseInt(border) == 1) isBorder = true;
                if (!isBorder) t.layout = 'noBorders';
                ParseContainer(t.table.body, e, p, styles);

                var widths = e.getAttribute("widths");
                if (!widths) {
                    if (t.table.body.length != 0) {
                        if (t.table.body[0].length != 0) for (var k = 0; k < t.table.body[0].length; k++) t.table.widths.push("*");
                    }
                } else {
                    var w = widths.split(",");
                    for (var k = 0; k < w.length; k++) t.table.widths.push(w[k]);
                }
                cnt.push(t);
                break;
            }
        case "tbody": {
            ParseContainer(cnt, e, p, styles);
            //p = CreateParagraph();
            break;
        }
        case "tr": {
            var row = [];
            ParseContainer(row, e, p, styles);
            cnt.push(row);
            break;
        }
        case "td": case "th": {
            p = CreateParagraph();
            var st = { 
                stack: [] 
            }
            var nodeName = e.nodeName.toLowerCase();
            st.stack.push(p);
            var rspan = e.getAttribute("rowspan");
            if (rspan) st.rowSpan = parseInt(rspan);
            var cspan = e.getAttribute("colspan");
            if (cspan) st.colSpan = parseInt(cspan);
            if (nodeName == 'th') st.style = 'redBar';

            ParseContainer(st.stack, e, p, styles);
            cnt.push(st);
            break;
        }
        case "div": case "p": {
            p = CreateParagraph();
            var st = { stack: [] }
            st.stack.push(p);
            ComputeStyle(st, styles);
            ParseContainer(st.stack, e, p);
            cnt.push(st);
            if (cs && cs.length > 0) {
                for (var index = 0; index < cs.length; index++) {
                    p["style"] = cs[index];
                }
            }
            break;
        }
        case "ul": case "ol":{
            var typeList, getType, separator, list;
            var nodeName = e.nodeName.toLowerCase();
            getType = e.getAttribute("type");
            separator = e.getAttribute("separator");
            // Check Type
            if (!getType) {
                typeList = 'disc';
            } else {
                typeList = getType
            }
            // Check Separator
            if (separator) {
                list.separator = [separator, ''];
            }
            list = {
                type: typeList,
                [nodeName]: []
            };
            
            ParseContainer(list[nodeName], e, p, styles);
            cnt.push(list);
            break;
        }
        case "li": {
            p = CreateParagraph();
            var st = { stack: [] }
            st.stack.push(p);
            ParseContainer(st.stack, e, p, styles);
            cnt.push(st);
            break;
        }
        default: {
            console.log("Parsing for node " + e.nodeName + " not found");
            break;
        }
    }
    return p;
}

function ParseHtml(cnt, htmlText) {
    var html = $(htmlText.replace(/\t/g, "").replace(/\n/g, ""));
    var p = CreateParagraph();
    console.log(html);
    for (var i = 0; i < html.length; i++){
        console.log('data: ', i);
        ParseElement(cnt, html.get(i), p);
    } 
}

function CreateParagraph() {
    var p = { text: [] };
    return p;
}
// HTML To Document Definition
function createDocumentDefinition(htmlString) {
    var content = [];
    ParseHtml(content, htmlString);
    console.log('ISI CONTENT: ', content);
    return content;
}

function textToBase64Barcode(texted) {
    var canvas = document.createElement("canvas");
    JsBarcode(canvas, texted, { format: "CODE39", displayValue: false });
    return canvas.toDataURL("image/png");
}

// Definition Variable
var logoPru = "data:image/jpeg;base64,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";