var ws;
//var data = {
//    nodes: [],
//    links: []
//};
var depth = 1;
var viewing_history = {};
var status = "viewing";//"modifying"
var status_backup = status;
var modifying_nodes = [];
const start_display_id = "graph0";
const graph_preview_id = "graph_preview"
var focused_input;




var config = {
    settings: {
        hasHeaders: true,
        constrainDragToContainer: true,
        reorderEnabled: true,
        selectionEnabled: false,
        popoutWholeStack: false,
        blockedPopoutsThrowError: true,
        closePopoutsOnUnload: true,
        showPopoutIcon: false,
        showMaximiseIcon: true,
        showCloseIcon: true
    },
    dimensions: {
        borderWidth: 5,
        minItemHeight: 10,
        minItemWidth: 10,
        headerHeight: 20,
        dragProxyWidth: 300,
        dragProxyHeight: 200
    },

//    content: [{
//        type: 'row',
//        isClosable: false,
//        id: "show_area",
//        content: [{
//            type: 'column',
//            isClosable: false,
//            width: 100,
//            content: [{
//                type: 'component',
//                isClosable: false,
//                componentName: 'preview',
//                height: 70,
//                componentState: {}
//            }, {
//                type: 'row',
//                isClosable: false,
//                id: "graph_area",
//                content: [{
//                    type: 'component',
//                    isClosable: false,
//                    componentName: 'graph',
//                    componentState: { id: start_display_id }
//                }]

//            }]

//        }
//        //    ,
//        //{
//        //    type: 'component',
//        //    isClosable: true,
//        //    componentName: 'modify',
//        //    componentState: {}

//        //    }
//        ]
//    }]

    content: [{
        type: 'row',
        isClosable: false,
        id: "show_area",
        content: [{
            type: 'row',
            isClosable: false,
            id: "graph_area",
            content: [{
                type: 'component',
                isClosable: false,
                componentName: 'graph',
                componentState: { id: start_display_id }
            }]
        }]
    }]
};



var myLayout = new window.GoldenLayout(config, document.getElementById('layoutContainer'));

myLayout.registerComponent('graph', function (container, state) {
    container.getElement().html("<div id='" + state.id + "'></div>");
    if (!viewing_history[state.id]) {
        init_history(state.id);
    }
    container.on('destroy', function (e) {
/*        console.log(state);*/
        close_display(state.id);
    });
    container.on('resize', function () {
        var id = state.id;
        update_dispaly_size(id,{ width: container.width, height: container.height });
        redraw(id);
    });
});


function save_modify_status() {
    var data = {};
    data.code = document.getElementById('tofill').value;
    var form = document.getElementById('modify_form');
    form.querySelectorAll('input').forEach(d => {
        d.setAttribute('value', d.value);
    });
    data.form_html=form.innerHTML;
    update_data('modify', data);
}

function load_modify_status() {
    var tofill = document.getElementById("tofill");
    var code = '';
    if (tofill) {
        code = tofill.value;
    }
    else {
        id = 'modify';
        if (get_record(id)) {
            var { data } = get_record(id);
            if (data.code) {
                code = data.code;
            }
        }

    }
    var form = document.getElementById('modify_form');
    var form_html = '';
    if (form) {
        form.querySelectorAll('input').forEach(d => {
            d.setAttribute('value', d.value);
    });
        form_html = form.innerHTML;
    }
    else {
        id = 'modify';
        if (get_record(id)) {
            var { data } = get_record(id);
            if (data.form_html) {
                form_html = data.form_html;
            }
        }
    }
    return { code ,form_html};
}

myLayout.registerComponent('modify', function (container, state) {
    container.getElement().html(`<div id='modify' class='modify'></div>`);
    var id = 'modify';
    if (!viewing_history[id]) {
        init_history(id);
    }
    container.on('destroy', function (e) {
        //document.getElementById('edit').disabled = false;
        document.getElementById('edit').classList.remove("command_chosen");
        status = "viewing";
        save_modify_status();
    });
    container.on('resize', function () {
        var id = 'modify';
        update_dispaly_size(id, { width: container.width, height: container.height });
        redraw_modify();
    });
});

myLayout.registerComponent('preview', function (container, state) {
    container.getElement().html(`<div id='${graph_preview_id}'></div>`);
    if (!viewing_history[id]) {
        init_history(id);
    }
    container.on('destroy', function (e) {

    });
    container.on('resize', function () {
        var id = graph_preview_id;
        update_dispaly_size(id, { width: container.width, height: container.height });
        redraw(id);
    });
});


myLayout.init();






function get_display(id) {
    //var div = d3.select("#graph");
    ////if not exist, create, otherwise doing nothing
    //if (div.select(id).empty())
    //    div.append("div").attr("id", id);
    //return div.select("#" + id);
    return d3.select("#" + id);
}

function get_click_display(d) {
    //return d.closest("#graph > div").id;
    return d.closest(".graph").id;
}


function deepEqual(x, y) {
    const ok = Object.keys, tx = typeof x, ty = typeof y;
    return x && y && tx === 'object' && tx === ty ? (
        ok(x).length === ok(y).length &&
        ok(x).every(key => deepEqual(x[key], y[key]))
    ) : (x === y);
}

function init_history(id) {
    viewing_history[id] = {
        record_ind: -1, record: [], data: {}, display_size: {}
    };
}

function update_item(id,item) {
    if (!viewing_history[id]) {
        init_history(id);
    }
    var { record_ind, record } = viewing_history[id];
    if (record[record_ind] && deepEqual(item,record[record_ind])) {
        return;
    }
    else {
        var item_clone = structuredClone(item);
        record.splice(record_ind + 1, record.length - record_ind - 1, item_clone);
        viewing_history[id].record_ind = record.length - 1;
        get_display(id).select(".bar").dispatch("change");
    }
}
function update_data(id,data){
    if (!viewing_history[id]) {
        init_history(id);
    }
    viewing_history[id].data = data;
}
function update_dispaly_size(id,size) {
    if (!viewing_history[id]) {
        init_history(id);
    }
    viewing_history[id].display_size = size;
}
function clear_history(id) {
    delete viewing_history[id];
}
function get_record(id) {
    if (viewing_history[id]) {
        var { record_ind, record, data, display_size } = viewing_history[id];
        var item = record[record_ind];
        return { item, data,display_size};
    }
    else
        return undefined;
}
function get_all_records(id) {
    if (viewing_history[id]) {
        var { record_ind, record } = viewing_history[id];
        return { record_ind, record};
    }
    else
        return undefined;
}
function set_record_ind(id, i) {
    if (viewing_history[id]) {
        viewing_history[id].record_ind = i;
        get_display(id).select(".bar").dispatch("change");
    }
}

function add_id_info(id,item) {
    item["status"] = { id: id,center:item["args"][0] };
    return item;
}

function getRelations(id, args, update_history) {
    var item = { name: "getRelations", args: args };
    if (update_history) {
        update_item(id, item);
    }
    ws.send(JSON.stringify(add_id_info(id, item)));
}

function insert_text(ele, text) {
    if (!ele) return;
    let pos = ele.selectionStart
    let front = (ele.value).substring(0, pos);
    let back = (ele.value).substring(pos, ele.value.length);

    ele.value = front + text + back;
    pos = pos + text.length;

    ele.selectionStart = pos;
    ele.selectionEnd = pos;
    ele.focus();
}

function click(self) {
    //console.log(self)
    name = self.querySelector("text").textContent;
/*    console.log(self.querySelector("text").textContent);*/
    switch (status) {
        case "viewing":         
            //getRelations(graph_preview_id, [name, Number(depth)], true);
            getRelations(get_click_display(self), [name, Number(depth)], true);
            break;
        case "modifying":
            if (d3.select("#modify_toggle").property('checked')) {
                //document.getElementById("tofill").value += " [" + name + "]";
                insert_text(document.getElementById("tofill"), `[${name}] `);
            }
            else {
                insert_text(focused_input, name);
            }
            break;
        default:

    }
}

function dblclick(self) {
    name = self.querySelector(".text").textContent;
    switch (status) {
        case "viewing":
            getRelations(get_click_display(self), [name, Number(depth)], true);
            break;
        case "modifying":
            document.getElementById("tofill").value +=" ["+ name + "]";
            break;
        default:

    }
}

function redraw(id) {
    if (get_record(id)) {
        var { data } = get_record(id);
        if (data)
            showGraph_dispatch(id, data);
    }
}

function redo(id) {
    if (get_record(id)) {
        var { item } = get_record(id);
        if (item) {
            item["status"] = { id: id };
            item["args"][1]=depth;
            ws.send(JSON.stringify(add_id_info(id, item)));
        }
    }
}

function bar_change_event(self) {
    var evt = document.createEvent("HTMLEvents");
    evt.initEvent("change", true, true);
    self.dispatchEvent(evt);
}

function forward(self) {
    var id = get_click_display(self);
    var { record_ind, record } = get_all_records(id);
    if (record_ind < record.length - 1) {
        viewing_history[id].record_ind = record_ind+1;
        redo(id);
        bar_change_event(self);
    }
}
function back(self) {
    var id = get_click_display(self);
    var { record_ind } = get_all_records(id);
    if (record_ind > 0) {
        viewing_history[id].record_ind = record_ind - 1;
        //console.log(viewing_history);
        redo(id);
        //console.log(self);
        bar_change_event(self);
    }
};
function show_back_list(self) {
    var id = get_click_display(self);
    var { record_ind, record } = get_all_records(id);
    //console.log(record_ind, record)
    const content = d3.select(self)
        .select(".history-content").style("display", "none")
        .style("position", "absolute");
    content.select("ul").remove();
    content_list=content.append("ul");
    for (var i = record_ind-1; i >= 0; i--) {
        content_list.append("li").text(record[i].args[0]).on("click", function (x) {
            return function () {
                set_record_ind(id, x);
                redo(id);
                content.style("display", "none");
                bar_change_event(self);
            };
        }(i));
    }
    content.style("display", "block");
}
function move_cancel(self) {
    var id = get_click_display(self);
    d3.select(self)
        .select(".history-content").style("display", "none");
}

function show_forward_list(self) {
    var id = get_click_display(self);
    var { record_ind, record } = get_all_records(id);
    const content = d3.select(self)
        .select(".history-content").style("display", "none")
        .style("position", "absolute");
    content.select("ul").remove();
    content_list=content.append("ul");
    for (var i = record_ind+1; i < record.length; i++) {
        content_list.append("li").text(record[i].args[0]).on("click", function (x) {
            return function () {
                set_record_ind(id, x);
                redo(id);
                content.style("display", "none");
                bar_change_event(self);
            };
        }(i));
    }
    content.style("display", "block");
}

function uid() {
    return Math.random().toString(36).substr(2, 3);
    //return (performance.now().toString(36) + Math.random().toString(36)).replace(/\./g, "");
};

function new_display(self) {
    var id=get_click_display(self);
    new_id = "graph" + uid();

    var newItemConfig = {
        title: "",
        type: 'component',
        componentName: 'graph',
        componentState: { id: new_id }
    };
    myLayout.root.getItemsById("graph_area")[0].addChild(newItemConfig);
    //console.log(myLayout.root.contentItems[0])
    var { item, data } = get_record(id);
    showGraph_dispatch(new_id, data);
    update_item(new_id, item);
    update_data(new_id,data);
}

function change_status() {
    var newItemConfig = {
        title: "",
        type: 'component',
        id: 'modify_area',
        isClosable: true,
        componentName: 'modify',
        componentState: {}
    };
    if (document.getElementById('modify')) {
        //myLayout.root.getItemsById("modify_area")[0].close();
        //if (status == "modifying") {
        //    document.getElementById('edit').classList.remove("command_chosen");
        //    status = "viewing";
        //}
        //else {
        //    document.getElementById('edit').classList.add("command_chosen");
        //    status = "modifying";
        //}
        myLayout.root.getItemsById("modify_area")[0].close();
        document.getElementById('edit').classList.remove("command_chosen");
    }
    else {
        myLayout.root.getItemsById("show_area")[0].addChild(newItemConfig);
        myLayout.root.getItemsById("modify_area")[0].container.setSize(0.25 * window.innerWidth, window.innerHeight);
        //document.getElementById('edit').disabled = true;
        document.getElementById('edit').classList.add("command_chosen");
        //status = "modifying";
    }
}


function close_display(id) {
    get_display(id).remove();
    clear_history(id);
}

function mouse_hold_click(d, fun_hold,fun_click,fun_cancel) {
    var pressTimer;
    var hold=false;
    d.select('button').on("mousedown", function () {
        var self = this;
        pressTimer = setTimeout(function () { fun_hold(self.parentElement); hold = true; }, 500);
    })
    .on("mouseup", function () {
        var self = this;
        clearTimeout(pressTimer);
        if (!hold) {
            fun_click(self);
        }
        hold = false;
    })
    d.on("mouseleave", function () {
        var self = this;
        clearTimeout(pressTimer);
        fun_cancel(self);
        hold = false;
    })
}



function bar_change(self) {
    var id = get_click_display(self);
    var { record_ind, record } = get_all_records(id);
    if (record_ind <= 0)
        self.querySelector('.back').querySelector('button').disabled = true;
    else
        self.querySelector('.back').querySelector('button').disabled = false;
    if (record_ind == record.length-1)
        self.querySelector('.forward').querySelector('button').disabled = true;
    else
        self.querySelector('.forward').querySelector('button').disabled = false;
}


function mouse_click_dblclick(d, fun_click, fun_dblclick) {
    var pressTimer;
    var dblclicked = false;
    d.on("click", function () {
        var self = this;
        dblclicked = false;
        pressTimer = setTimeout(function () { if (!dblclicked) { fun_click(self); } }, 300);
    })
        .on("dblclick", function () {
            var self = this;
            clearTimeout(pressTimer);
            dblclicked = true;
            fun_dblclick(self);
        })
}

function showGraph_dispatch(id, data) {
    var opt;
    if (id == graph_preview_id)
        opt = { bar_items: false, size_auto: false, click_event: true, default_is_graph: false };
    else
        opt = { bar_items: true, size_auto: false, click_event: true, default_is_graph: true };
    showGraph(id, data, opt);
}

function showGraph(id, data,opt) {
    var div_graph = get_display(id);
    // set the dimensions and margins of the graph
    var margin = { top: 0, right: 0, bottom: 0, left: 0 },
        width = window.innerWidth*0.96 - margin.left - margin.right,
        height = window.innerHeight * 0.96 - margin.top - margin.bottom;

    div_graph.attr("class", "graph");

    if (div_graph.select(".bar").empty()) {
        const bar = div_graph.append("div").attr("class", "bar");
        if (opt.bar_items) {
            bar.on("change", function () { bar_change(this); });
            const back_div = bar.append("div").attr("class", "back");
            back_div.append("button").text("<");
            mouse_hold_click(back_div, show_back_list, back, move_cancel);
            back_div.append("div").attr("class", "history-content");
            const forward_div = bar.append("div").attr("class", "forward");
            forward_div.append("button").text(">");
            mouse_hold_click(forward_div, show_forward_list, forward, move_cancel);
            forward_div.append("div").attr("class", "history-content");
            bar.append("div").attr("class", "new").append("button").text("+")
                .on("click", function () { new_display(this); });
            bar.dispatch("change");
        }
        bar.append("div").attr('class', 'form-switch').append("input").attr("type", "checkbox")
            .property('checked', !opt.default_is_graph).attr('class', 'form-check-input')
            .on('click', function () { redraw(id); });
         bar.append("input").attr('class','depth').attr('type','number').attr('value',depth).attr('max',5).attr('min',-1)
         .on('change', function () { 
                                 depth=Number(document.getElementById(id).querySelector(".depth").value);
                                 redo(id);
                                 });
        if (id == start_display_id) {
            bar.append("div").append("button").attr("id","edit").html('<span class="iconfont icon-edit"></span>')
                .on("click", function () { change_status(); });
            bar.append("div").attr('id','connection').html(`<span class="iconfont icon-phone-signal-full"></span>`);
        }
    }

    if (div_graph.select(".graph_content").empty())
        div_graph.append("div").attr("class", "graph_content")

    var { display_size } = get_record(id);
    var { width: content_width, height: content_height } = display_size;
    content_height = content_height - div_graph.select(".bar").node().getBoundingClientRect().height;

    if (opt.size_auto) {
        width = content_width;
        height = content_height;
    }
    const div = div_graph.select(".graph_content")
        .style('width', content_width+"px")
        .style('height', content_height + "px");

    const bar = div_graph.select(".bar");
    div.select("table").remove()
    div.select("svg").remove()
    div.select(".control").remove()
    if (bar.select('input').property('checked'))
        showContent(div, data, width, height, margin, opt);
    else
        drawSvg(div, data, width, height, margin, opt);
}
function wrap(text, width) {
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split("").reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            x = text.attr("x"),
            y = text.attr("y"),
            dy = 0, //parseFloat(text.attr("dy")),
            tspan = text.text(null)
                .append("tspan")
                .attr("x", x)
                .attr("y", y)
                .attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(""));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(""));
                line = [word];
                tspan = text.append("tspan")
                    .attr("x", x)
                    .attr("y", y)
                    .attr("class","collapse")
                    .attr("dy", ++lineNumber * lineHeight + dy + "em")
                    .text(word)
            }
        }
    });
}

function overlap(a, b) {
    //return ((a.x < b.x)&&(b.x < a.x2()) && (a.y < b.y)&& (b.y < a.y2())) ||
    //    ((a.x < b.x2())&&(b.x2() < a.x2()) && (a.y < b.y2())&&(b.y2() < a.y2()));
    return ( ((a.x < b.x) && (b.x < a.x2())) || ( (a.x < b.x2()) && (b.x2() < a.x2()) ) )
        && ( ((a.y < b.y) && (b.y < a.y2())) || ( (a.y < b.y2()) && (b.y2() < a.y2()) ) );
}
function clamp(x,a,b) {
    if (x < a) {
        x = a;
    }
    if (x > b) {
        x = b;
    }
    return x;
}

function collide(node, width, height) {
    var nx1, nx2, ny1, ny2, padding;
    padding = 0;
    nx1 = node.x - padding;
    nx2 = node.x2() + padding;
    ny1 = node.y - padding;
    ny2 = node.y2() + padding;
    alpha = 1;
    return function (quad, x1, y1, x2, y2) {
        var dx, dy;
        if (quad.data && (quad.data !== node)) {
            if (overlap(node, quad.data)) {
                dx = Math.min(node.x2() - quad.data.x, quad.data.x2() - node.x) / 2;
                dy = Math.min(node.y2() - quad.data.y, quad.data.y2() - node.y) / 2;
                /*if (Math.abs(dx) / node.width < Math.abs(dy) / node.height) {*/
                //if (Math.random() < Math.abs(dy) / (Math.abs(dx) + Math.abs(dy))){
                if (Math.abs(dx)< Math.abs(dy)) {
                    node.x -= dx * alpha;
                    quad.data.x += dx;
                }
                else {
                    node.y -= dy * alpha;
                    quad.data.y += dy * alpha;
                }
/*                console.log(node);*/
                //console.log(">");
                //console.log(quad.data);
                //console.log(node);
                //console.log("<");
            }
        }
        node.x = clamp(node.x, padding, width - node.width);
        node.y = clamp(node.y, padding, height - node.height);
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    };
};

function showNodeHeader(node, header_height) {
    node.style("opacity", 0.2);
    node.on("mouseover", function () {
        d3.select(this).style("opacity", 1)
    })
        .on("mouseleave", function () {
            d3.select(this).style("opacity", 0.2);
        });
    var image_size = header_height*0.8;
    var padding = 6;
    node.each(function(item){
        item.header_x = 0;
        if(item.file){
            d3.select(this).append("a")
            .attr("href",item.file)
            .attr("target", "_blank")
            //.append("text")
            //.attr("x", 8)
            //.attr("y", "-0.5em")
            //.text(d => d.file ? "link" : "")
            .append("image")
            .attr('href', d => {
                d.header_x += image_size + padding;
                return 'img/link.svg';
                //return '#icon-link';
            })
            .attr('width', image_size)
            .attr('height', image_size)
            .on('mouseover', function () {
                d3.select(this).style('transform', 'scale(1.1)');
            })
            .on('mouseleave', function () {
                d3.select(this).style('transform', 'scale(1)');
            })
            .append("title").text("open file")
        }
    })


    node.each(function(item){
        if(item.file){
            d3.select(this).append("image")
            .attr('href', 'img/folder.svg')
            //.attr('href', '#icon-copy')
            .attr('width', image_size)
            .attr('height', image_size)
            //.append('text')
            .attr("x", d => {
                var header_x = d.header_x;
                d.header_x += image_size + padding;
                return header_x;
            })
            //.attr("y", -20)
            .on('click', function () {
                navigator.clipboard.writeText(item.file);
                ws.send(JSON.stringify({ name: 'openExternal', args: [item.file] }));
            })
            .on('mouseover', function () {
                d3.select(this).style('transform', 'scale(1.1)');
            })
            .on('mouseleave', function () {
                d3.select(this).style('transform', 'scale(1)');
            })
            .append("title").text("open external")
        }
    })

    node.append("image")
        .attr('href', 'img/copy.svg')
        //.attr('href', '#icon-copy')
        .attr('width', image_size)
        .attr('height', image_size)
        //.append('text')
        .attr("x", d => {
            var header_x = d.header_x;
            d.header_x += image_size + padding;
            return header_x;
        })
        //.attr("y", -20)
        .on('click', function (d,node) {
            //var node = d3.select(this).data()[0];
            navigator.clipboard.writeText(node.name);
            if (status == 'modifying') {
                load_info(node);
            }
        })
        .on('mouseover', function () {
            d3.select(this).style('transform','scale(1.1)');
        })
        .on('mouseleave', function () {
            d3.select(this).style('transform', 'scale(1)');
        })
        .append("title").text("copy to clipboard")
}

function drawSvg(div, data, width, height, margin, opt) {
    if (deepEqual(data, {})) return;

    if (div.select(".control").empty()) div.append("div").attr("class", 'control')

    const control = div.select(".control");
    control.selectAll('*').remove();
    control.append('div').append('input').attr("class", 'strength').attr('type', 'range').attr('min', 1).attr('max', 100).attr('value', 10)
    control.append('div').append('input').attr("class", 'charge').attr('type', 'range').attr('min', 0).attr('max', 1000).attr('value', 400);

    // append the svg object to the body of the page
    if (div.select("svg").empty()) div.append("svg");

    const svg = div
        .select("svg")
        .attr("width", width)
        .attr("height", height)
        //.attr("viewBox", `${margin.left} ${margin.top} ${width} ${height}`)
        .attr("transform",
            `translate(${margin.left}, ${margin.top})`);
    svg.selectAll('*').remove()

    // Initialize the links
    const link = svg
        .selectAll("path")
        .data(data.links)
        .join("path")

    // Initialize the nodes
    const node = svg.append("g")
        .selectAll("g")
        .data(data.nodes)
        .join("g")
            //.on("dblclick", function () { dblclick(this); })
        //mouse_click_dblclick(node, click, dblclick);
    //.on("mouseover", function () {
    //    d3.select(this).select("circle").attr('stroke', 'blue');
    //    d3.select(this).select("text").attr('fill', 'red');
    //})
    //.on("mouseleave", function () {
    //    d3.select(this).select("circle").attr('stroke', 'white');
    //    d3.select(this).select("text").attr('fill', 'black');
    //});


    node.append("circle")
        .attr("r", 4);


    var text_width = 500;
    var padding = 32;
    var header_height = 14;
    var node_header = node.append("svg")
        .attr('height', header_height)
        .attr("x", 8)
        .attr("y", "-1.5em")

    showNodeHeader(node_header,header_height);


    node.append("g").attr("class", "text").append("text")
        .attr("x", 8)
        .attr("y", "0.5em")
        .text(d => d.name).call(wrap, text_width)
        .attr("class", d => "order" + (d.order ? d.order : 0))


    if (opt.click_event)
        node.selectAll(".text").on("click", function () { click(this); })
    //.clone(true)
    //.lower()
    //.attr("fill", "none")
    //.attr("stroke", "white")
    //.attr("stroke-width", 3);

    var strength = 1/Number(control.select('.strength').property('value'));
    var charge = -Number(control.select('.charge').property('value'));

    // Let's list the force we wanna apply on the network
    var simulation = d3.forceSimulation(data.nodes)                 // Force algorithm is applied to data.nodes
        .force("link", d3.forceLink()                               // This force provides links between nodes
            .links(data.links)                                    // and this the list of links
            .strength(strength)
            .distance(0)
        )
        .force("charge", d3.forceManyBody().strength(charge))         // This adds repulsion between nodes. Play with the -400 for the repulsion strength
        .force("center", d3.forceCenter(width / 2, height / 2))     // This force attracts nodes to the center of the svg area
        .alphaMin(0.1)
        .alphaDecay(0.0228)
        .on("tick", tick);


    node.selectAll(".collapse").style("display", "none");
    node.each(function (d, i) {
        var item = data.nodes[i];
        item.x = width * Math.random();
        item.y = height * Math.random();
        item.width = this.getBBox().width + padding;
        item.height = this.getBBox().height + padding;
        item.x2 = function () { return item.x + item.width; }
        item.y2 = function () { return item.y + item.height; }
    });

    node.selectAll(".text").each(function () {
        var mouseover_timer;
        d3.select(this)
            .on("mouseover", function () {
                var self = this;
                mouseover_timer = setTimeout(function () {
                    var collapse = d3.select(self).selectAll(".collapse");
                    if (!collapse.empty()) {
                        collapse.style("display", "block");
                        var item = d3.select(self).data()[0];
                        item.width = self.getBBox().width + padding;
                        item.height = self.getBBox().height + padding;
                        //simulation.alphaTarget(0.4).restart();
                    }
                }, 1000);
            })
            .on("mouseleave", function () {
                var self = this;
                clearTimeout(mouseover_timer);
                setTimeout(function () {
                    var collapse = d3.select(self).selectAll(".collapse");
                    if (!collapse.empty()) {
                        d3.select(self).selectAll(".collapse").style("display", "none");
                        var item = d3.select(self).data()[0];
                        item.width = self.getBBox().width + padding;
                        item.height = self.getBBox().height + padding;
                        //simulation.alphaTarget(0.4).restart();
                    }
                }, 1000);
            });
    });


    // This function is run at each iteration of the force algorithm, updating the nodes position.
    function tick() {
        q = d3.quadtree(data.nodes,it=> it.x,it=>it.y);
        data.nodes.forEach(function (item) {
            q.visit(collide(item,width,height));
        })
        node.attr("transform", d => `translate(${d.x},${d.y})`);
        link.attr("d", d => `M${d.source.x},${d.source.y} L ${d.target.x},${d.target.y}`);
    }

    drag = simulation => {

        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.5).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    node.selectAll(".text").call(drag(simulation));
    control.select('.strength').on("input", function () {
        var strength = 1 / Number(control.select('.strength').property('value'));
        simulation.force("link", d3.forceLink()
            .links(data.links)                     
            .strength(strength)
            .distance(0)
        )
        simulation.alphaTarget(0.5).restart();
        setTimeout(function () { simulation.alphaTarget(0); }, 1000);
    });
    control.select('.charge').on("input", function () {
        var charge = -Number(control.select('.charge').property('value'));
        simulation.force("charge", d3.forceManyBody().strength(charge));
        simulation.alphaTarget(0.5).restart();
        setTimeout(function () { simulation.alphaTarget(0); }, 1000);
    });
}
function graph2Table(data) {
    content = new Map();
    data.nodes.forEach(function (item) {
        item.getOrder = function () {
            return item.order ? item.order : 0;
        }
    })
    if (data.links.length == 0) {
        return content;
    }
    else {
        if (data.links[0].source.constructor != Object) {
            data.links.forEach(function (item) {
                item.source = data.nodes[item.source];
                item.target = data.nodes[item.target];
            });
        }
        data.links.forEach(function (item) {
            var source = item.source;
            var target = item.target;
            if (source.getOrder() == target.getOrder()) {
                //if (source.order != 0) {
                //    if (!content.hasOwnProperty(source.name))
                //        content[source.name] = [];
                //    if (!content.hasOwnProperty(target.name))
                //        content[target.name] = [];
                //}
                return;
            }
            if (source.getOrder() < target.getOrder())
                [source, target] = [target, source];
            if (!content.has(source)) {
                content.set(source, [target]);
            }
            else {
                content.get(source).push(target);
            }
        }
        );
    }
    return content;
}
function showContent(div, data, width, height, margin, opt) {
    if (deepEqual(data, {})) return;
    content = graph2Table(data);
    if (div.select("table").empty()) div.append("table");
    const table = div
        .select("table")
        //.attr("width", width)
        //.attr("height", height);
    table.selectAll('*').remove();
    content.forEach(function (value, item_key) {
        var row = table.append("tr");
        var row_a = row.append("td").append("a")
            .on("click", function () { click(this); })
        //.on("dblclick", function () { dblclick(this); });
        //mouse_click_dblclick(row_a, click, dblclick);
        row_a.append("text").text(item_key.name);
        row_a = row.append("td").append("dl");

        var node=row_a.selectAll("dt")
            .data(value)
            .join("dt")
        var header_height = 14;
        var node_header = node.append("svg").attr('width', 80).attr('height', header_height);
        showNodeHeader(node_header, header_height);
        node.append("div").attr('class', 'text')
            .append("text").text(d => d.name);

        if (opt.click_event)
            node.selectAll(".text").on("click", function () { click(this); })
        //mouse_click_dblclick(node, click, dblclick);
        //.on("dblclick", function () { dblclick(this); })
    });
    //console.log(content);
}
function updateGraph() {
    for (id in viewing_history) {
        redo(id);
    }
}

//function show_modify_form(data) {
    //if (data.center) {
    //    content = graph2Table(data);
    //    div = d3.select('#modify_form');
    //    if (div.select("table").empty()) div.append("table");
    //    const table = div
    //        .select("table")
    //    //.attr("width", width)
    //    //.attr("height", height);
    //    table.selectAll('*').remove();
    //    table.append("caption").text(data.center);
    //    for (var item_key in content) {
    //        var row = table.append("tr");
    //        var row_a = row.append("td").append("a")
    //            //.on("click", function () { click(this); })
    //            //.on("dblclick", function () { dblclick(this); });
    //        row_a.append("text").text(item_key);
    //        row_a = row.append("td").append("dl");
    //        for (var i in content[item_key]) {
    //            var item_v = content[item_key][i];
    //            var row_dt = row_a.append("dt");
    //                //.on("click", function () { click(this); })
    //                //.on("dblclick", function () { dblclick(this); })
    //            row_dt.append("input").attr("type", "text")
    //                .attr("value", item_v)
    //            row_dt.append("input").attr("type", "checkbox");
    //        }
    //    }
    //    var row = table.append("tr");
    //    var row_a = row.append("td").append("a")
    //    //.on("click", function () { click(this); })
    //    //.on("dblclick", function () { dblclick(this); });
    //    row_a.append("text").text("...");
    //    if (div.select("#modify_confirm").empty()) div.append("button").attr("id","modify_confirm").text("confirm");
    //}
//}

function save_focused() {
    focused_input=document.activeElement;
}

function add_new_info(self) {
    var d = self.closest('.form_new_info');
    var html = d.outerHTML;
    html = `<div class='info right'>` +
        `<div class='left'><input  type="text" value="" placeholder="infoKey" onfocus='save_focused()'/></div>` +
        `<div class='right' ><input type="text" value="" placeholder="infoValue" onfocus='save_focused()'/></div>` +
        `</div>` + html;
    d.outerHTML = html;
}

function add_new_item(self) {
    var d = self.closest('.form_new_item');
    var html = d.outerHTML;
    html = `<div class='kvs'><div class='left'><input  type="text" value="" placeholder="key" onfocus='save_focused()'/></div>` +
        `<div class='right' ><input type="text" value="" placeholder="value" onfocus='save_focused()'/></div></div>` + html;
    d.outerHTML = html;
}

function show_modify_form(bib_content,bib_keys) {
    var form = document.getElementById("modify_form");
    var html = `<div class='form_entry'>`;
    for (var entry of bib_content) {
        var i = 0;
        for (var key of bib_keys) {
            if (entry[key]) {
                var values = entry[key];
                if (key == 'author')
                    values = values.join("; ");
                html += `<div class='kvs'>`;
                html += `<div class='left'><input  type="text" value="${key}" onfocus='save_focused()'/></div>`;
                html += `<div class='right' ><input type="text" value="${values}" onfocus='save_focused()'/></div>`;
                html += `</div>`;
                if (i == 0) {
                    html += `<div>`
                    for (var info_key in entry['info']) {
                        html += `<div class='info right'>` +
                            `<div class='left'><input  type="text" value="${info_key}" onfocus='save_focused()'/></div>` +
                            `<div class='right' ><input type="text" value="${entry['info'][info_key]}" onfocus='save_focused()'/></div>` +
                            `</div>`
                    }
                    html+=`<div class='form_new_info right'><label onclick=add_new_info(this)>+</label></div >` +
                            `</div>`;
                    html +=`<hr>`
                }
                i++;
            }
        }
        html += `<div class='form_new_item'><label onclick=add_new_item(this)><span>+</span></label></div>`;
    }
    html += `</div>`;
    form.innerHTML = html;
}

function update_bib_keys(data) {
    var nodes = data.nodes;
    if (nodes.length != 0) {
        nodes.forEach(d => {
            if (d.name != 'item') {
                if (!bib_keys.includes(d.name)) {
                    bib_keys.push(d.name);
                }
            }
        });
    }
}

function handle_msg(dataJson) {
    //console.log(dataJson);
    var id = dataJson.status.id;
    var data = { nodes: dataJson.nodes, links: dataJson.links };
    //console.log(data);
    if (id == graph_preview_id) {
        data['center'] = dataJson.status.center;
        //show_modify_form(data);
        update_data('modify', data);
    }
    if (id != 'keys') {
        showGraph_dispatch(id, data);
        update_data(id, data);
        //document.getElementById("show").innerHTML = received_msg;
    }
    else {
        update_bib_keys(data);
    }
}

if ("WebSocket" in window) {
    // 打开一个 web socket
    ws = new WebSocket("ws://localhost:9002");
    ws.onopen = function()
    {
        document.getElementById('connection').classList.add('connected');
        // Web Socket 已连接上，使用 send() 方法发送数据
        //ws.send(JSON.stringify({ name: "getRelations", args: ["root", -1] }));
        getRelations(start_display_id, ["title", Number(depth)], true);
        getRelations('keys', ["item", 1], false);
    };
    ws.onmessage = function (evt) {
        var received_msg = evt.data;
        var dataJson = JSON.parse(received_msg);
            //data.nodes.push({ name: dataJson.name });
            //dataJson.neighbours.forEach(function (item) {
            //    data.nodes.push({ name: item });
            //    var link = {
            //        source: dataJson.name,
            //        target: item
            //    };
            //    data.links.push(link);
            //});
        handle_msg(dataJson);
    };

    ws.onclose = function ()
        {
            // 关闭 websocket
        //alert("连接已关闭...");
        document.getElementById('connection').classList.remove('connected');
        document.getElementById('connection').classList.add('disconnected');
        }
}
else{
        // 浏览器不支持 WebSocket
    alert("您的浏览器不支持 WebSocket!");
}

function send()
{
    var msg = document.getElementById("msg").value;
    console.log(msg);
    ws.send(msg);
}
function changeDepth(id) {
    depth=document.getElementById("depth").value;
}
var command_table = {
    link: 'linkNodes', unlink: 'unlinkNodes',
    remove: 'removeNodes', rename: "renameNode",
    save: "save",
    frombib: "frombib",
    setInfo:'setInfo'
}
var command_usage = {
    link: 'link [obj1] [obj2]', unlink: 'unlink [obj1] [obj2]',
    remove: 'remove [obj]', rename: "rename [obj1] [obj2]",
    save: "save",
    frombib: "frombib [bib]",
    setInfo:'setInfo [obj] [key] [value]'
}
async function insert_after_click(command) {
    if (command == 'frombib') {
        return navigator.clipboard.readText().then(text => { return `[${text}]`; });
    }
    else
        return '';
}
function parse_input(code) {
    var result = new Array();
    var commands = code.split("\n");
    commands = commands.map(item => item.trim());
    commands = commands.filter(item => item);
    commands = commands.map(item =>
        item.split(/\s+\[([^\]]+)\]/g).filter(it => it));
    //console.log(commands);
    for (var i = 0; i < commands.length;i++) {
        var command_obj = {};
        name = commands[i][0];
        if (command_table.hasOwnProperty(name)) {
            command_obj.name = command_table[name];
            nodes = commands[i].slice(1);
            nodes.forEach(function (part, ind, array) {
                //console.log(part);
                //tmp = part.trim().split(/(.+):(\d+)$/g).filter(it => it);
                tmp = part.trim();
                //console.log(tmp);
                //if (!tmp[1])
                //    array[ind] = tmp[0];
                //else
                //    array[ind] = { name: tmp[0], order: tmp[1] };
                array[ind] = tmp;
            });
            command_obj.args = nodes;
            result.push(command_obj);
        }
    }
    //console.log(result);
    return result;
}

function parse_bib(bib_str) {
    var bib_str = bib_str.replace(/\\n/g, "\n");
    //console.log(bib_str);
    var bib = bibtexParse.toJSON(bib_str);
    var result = new Array();
    for (var entry of bib) {
        //console.log(entry);
        var item = {};
        item['info'] = {};
        item['info']['bib'] = bibtexParse.toBibtex([entry]);
        item['info']['file'] = '';
        item['key'] = entry.citationKey;
        item['center_key'] = 'title';
        for (var key in entry.entryTags) {
            var values = entry.entryTags[key];
            if (key == "author") {
                values = values.split(" and ");
            }
            item[key] = values;
        }
        result.push(item);
    }
    return result;
}

function gen_code_bib(bib_content, bib_keys, result) {
    for (var entry of bib_content) {
        var center_key = entry['center_key'];
        for (var key of bib_keys) {
            if (entry[key]) {
                var values = entry[key];
                //if (key != 'author')
                //    values = [values];
                if (!Array.isArray(values)) {
                    values = [values];
                }
                for (var value of values) {
                    var nodes = [{ name: key, order: "1" },  value];
                    result.push({ name: command_table["link"], args: nodes });
                    nodes = [{ name: 'item', order: "2" } ,{ name: key, order: "1" }];
                    result.push({ name: command_table["link"], args: nodes });
                    if (entry[center_key]) {
                        if (key != center_key) {
                            nodes = [entry[center_key],
                                value];
                            result.push({ name: command_table["link"], args: nodes });
                        }
                    }
                }
            }
        }
        if (entry[center_key]) {
            for (var key in entry['info']) {
                result.push({ name: 'setInfo', args: [entry[center_key], key, entry['info'][key]] });
            }
        }
    }
}

var bib_keys = ["title", "author", "year", "journal"];
function gen_code(code) {
    var result = new Array();
    for (var i = 0; i < code.length; i++) {
        var command = code[i].name;
        if (command == 'frombib') {
            var bib_content = parse_bib(code[i].args[0]);
            gen_code_bib(bib_content, bib_keys,result);
        }
        else {
            result.push(code[i]);
        }
    }
    //console.log(result);
    return result;
}


function modify_confirm() {
    var code = document.getElementById("tofill").value;
    var args = gen_code(parse_input(code));
    if (args.length) {
        ws.send(JSON.stringify({ name: 'combo', args: args }));
        //console.log(JSON.stringify({ name: 'combo', args: args }));
        updateGraph();
    }
}
function tofill_change() {

}
function change_mode() {
    if (status == "viewing") {
        status = "modifying";
        document.getElementById('node_select').classList.add("command_chosen");
    }
    else {
        status = "viewing";
        document.getElementById('node_select').classList.remove("command_chosen");
    }
}
function choose_file() {
    var input = document.createElement('input');
    input.type = 'file';
    input.onchange = e => {
        var file = e.target.files[0];
        //console.log(file);
        document.getElementById("tofill").value += " [" + file.name + "]";
    }
    input.click();
}

function show_modify_advanced(){
    var modify_advanced_menu = `<div id= 'modify_advanced_menu' class='modify_advanced_menu'>`;
    //modify_advanced_menu += `<button id='node_select' onclick='change_mode()'><span class="iconfont icon-hand"></span></button>`;//🡬
    for (var key in command_table) {
        var title= command_usage[key];
        modify_advanced_menu += `<button id='${key}' title='${title}'>${key}</button>`;
    }
    //modify_advanced_menu += `<button id='choose_file' onclick='choose_file()'>🗎</button>`;//📁
    modify_advanced_menu += `</div>`;

    modify_html = modify_advanced_menu
        + `<div>
<!--        <input type="text" id="msg" />
        <button type="button" onclick="send()">send</button>
    </div>
    <div>
        <input type="number" id="depth" name="depth" min="1" onchange="changeDepth()">
    </div>--!>
    <div id="modifying">
<!--<label>nodes: </label>--!>
<textarea id='tofill' onchange='tofill_change()'></textarea>
<div>
<button id='clear' > clear</button >
<button id='confirm'> confirm</button >
</div>
</div>
<!--    <div>
        <p id="show"></p>
    </div>!-->
</div>
`;

    var {code }=load_modify_status();

    document.getElementById('modify_advanced').innerHTML = modify_html;
    document.getElementById("tofill").value = code;
    if (status == "modifying")
        document.getElementById('node_select').classList.add("command_chosen");
    for (var key in command_table) {
        document.getElementById(key).onclick = function (command_key) {
            return function () {
                insert_after_click(command_key).then(text => {
                    //document.getElementById("tofill").value += command_key + " " + text;
                    insert_text(document.getElementById("tofill"), command_key + " " + text);
                });
            };
        }(key);
    }
    document.getElementById('clear').onclick = function () {
        document.getElementById('tofill').value = '';
    };
    document.getElementById('confirm').onclick = function () {
        modify_confirm();
    };
        //var current_command_key = undefined;
    //for (key in menu) {
    //    document.getElementById(key).onclick = function (command_key) {
    //        return function () {
    //            if (current_command_key != command_key) {
    //                this.classList.add("command_chosen");
    //                if (current_command_key) {
    //                    document.getElementById(current_command_key).classList.remove("command_chosen");
    //                    status = "viewing";
    //                }
    //                current_command_key = command_key;
    //                document.getElementById('confirm').disabled = false;
    //                document.getElementById('confirm').onclick = function () {
    //                    modify_confirm();
    //                };
    //                status_backup = status;
    //                status = "modifying";
    //            }
    //            else {
    //                this.classList.remove("command_chosen");
    //                current_command_key = undefined;
    //                document.getElementById('confirm').disabled = true;
    //                status = status_backup;
    //            }
    //        }
    //    }(key);
    //}
    //id = 'modify';
    //if (get_record(id)) {
    //    var { data } = get_record(id);
    //    //if (data)
    //        //show_modify_form(data);
    //}
}
function frombib_form() {
    navigator.clipboard.readText().then(text => {
        var bib_content = parse_bib(text);
        if (bib_content.length!=0) {
            show_modify_form(bib_content, bib_keys);
        }
    });
}

function clear_form() {
    var empty_content = [{}];
    bib_keys.forEach(function (d){
         empty_content[0][d]='...';
         if(needSplit(d)){
             empty_content[0][d]=['...'];
         }
    })
    show_modify_form(empty_content, bib_keys);
    var nodes = document.getElementsByClassName('form_entry')[0].querySelectorAll('input');
    nodes.forEach(function (d) {
        if(!bib_keys.includes(d.value)){
            d.value = '';
            d.placeholder='...';
         }
    });
}

function needSplit(key){
   if (key == 'author'|| key=='tag') {
         return true;
    }
   return false;
}

function confirm_form() {
    var bib_content = [{}];
    var bib_keys = new Set();
    var entries = document.getElementsByClassName('form_entry');
    for (var i = 0; i < entries.length;i++) {
        var entry = entries[i];
        entry.querySelectorAll('.kvs').forEach(function(d,index,a){
            var key = d.querySelectorAll('input')[0].value.trim();
            var value = d.querySelectorAll('input')[1].value.trim();
            if (needSplit(key)) {
                value = value.split('; ').filter(item=>item);
            }
            if (value.length != 0) {
                if (key.length == 0) {
                    key = index;
                }
                else {
                    bib_keys.add(key);
                }
                bib_content[i][key] = value;
            }
            if (index == 0) {
                bib_content[i]['center_key'] = key;
            }
        });
        entry.querySelectorAll('.info').forEach(d => {
            var key = d.querySelectorAll('input')[0].value.trim();
            var value = d.querySelectorAll('input')[1].value.trim();
            if (!bib_content[i]['info']) {
                bib_content[i]['info'] = {};
            }
            if (key.length != 0) {
                bib_content[i]['info'][key] = value;
            }
        });
    }
    //console.log(bib_content)
    var args = new Array();
    gen_code_bib(bib_content, Array.from(bib_keys), args);
    if (args.length) {
        ws.send(JSON.stringify({ name: 'combo', args: args }));
        //console.log(JSON.stringify({ name: 'combo', args: args }));
        updateGraph();
    }
}

function load_info(node) {
    var bib_content = [{}];
    bib_content[0][""] = node.name;
    var info = {};
    var keys = Object.keys(node);
    var keys_to_remove = ['name', 'header_x', 'index', 'x', 'y', 'vx', 'vy',
        'width', 'height', 'x2', 'y2', 'fx', 'fy','getOrder'];
    keys=keys.filter(d => !keys_to_remove.includes(d));
    for (var key of keys) {
           info[key] = node[key];
    }
    bib_content[0]['info'] = info;
    show_modify_form(bib_content, [""]);
}

function save(){
   ws.send(JSON.stringify({ name: 'save', args:[]}));
}

function show_modify_simple() {
    var { form_html } = load_modify_status();
    document.getElementById('modify_simple').innerHTML = `<div class='modify_simple_menu'>
<button id='frombib_form' onclick='frombib_form()'>frombib</button>
<button id='save' onclick='save()'>save</button>
</div>
<div id='modify_form' class='modify_form'></div>
<input type = "button" value = 'clear' onclick='clear_form()'>
<input type = "button" value = 'confirm' onclick='confirm_form()' >`;
    document.getElementById('modify_form').innerHTML = form_html;
    if (form_html.length == 0) {
        clear_form();
    }
}

function redraw_modify() {
    var { display_size } = get_record('modify');
    document.getElementById('modify').style.height = display_size.height + "px";
    document.getElementById('modify').style.width = display_size.width + "px";
 

    var modify_id = d3.select('.modify');
    var toggle;
    if (modify_id.select("#modify_menu").empty()) {
        var menu = modify_id.append("div").attr("id", "modify_menu").attr("class", "bar")
        toggle = menu.append("div").attr("class", 'form-switch')
            .append("input").attr("type", "checkbox").attr("class", 'form-check-input')
            .attr("id", "modify_toggle")
            .property('checked', false)
            .on('click', function () { redraw_modify(); })

        menu.append('button').attr('id', 'node_select')
            .on('click', change_mode)
            .html(`<span class="iconfont icon-hand"></span>`);
        change_mode();
    }
    else {
        toggle = modify_id.select("#modify_menu").select("#modify_toggle");
    }
    var advanced_style = "none",simple_style="block";
    if (toggle.property('checked')) {
        advanced_style = "block";
        simple_style = "none";
    }
    if (modify_id.select("#modify_advanced").empty()) {       
        modify_id.append("div").style("display", advanced_style)
            .attr("id", "modify_advanced");
    }
    else {
        modify_id.select("#modify_advanced").style("display", advanced_style);
    }
    if (modify_id.select("#modify_simple").empty()) {
        modify_id.append("div").style("display", simple_style)
            .attr("id", "modify_simple");
    }
    else {
        modify_id.select("#modify_simple").style("display", simple_style);
    }


    show_modify_advanced();
    show_modify_simple();
}