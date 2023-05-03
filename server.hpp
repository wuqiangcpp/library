#pragma once
#include "websocketpp/config/asio_no_tls.hpp"
#include "websocketpp/server.hpp"
#include"library.h"
#include <iostream>
#include<unordered_map>
#include<string>
#include<functional>
#include"util.hpp"

#include"win_system.hpp"

typedef websocketpp::server<websocketpp::config::asio> server;

using websocketpp::lib::placeholders::_1;
using websocketpp::lib::placeholders::_2;
using websocketpp::lib::bind;

// pull out the type of messages sent by our config
typedef server::message_ptr message_ptr;
Library lib;
typedef std::function<Json::Value(const Json::Value&)> handler_fun;
std::unordered_map<std::string,handler_fun> msg_handlers;


void send(server* s, websocketpp::connection_hdl hdl, const Json::Value& json) {
    auto msg = json_stringify(json);
    s->send(hdl, msg, websocketpp::frame::opcode::text);
}


Json::Value getRelations( const Json::Value& json) {
    try {
        const Json::Value& args = json["args"];
        auto return_json = lib.getRelations(args[0], args[1].asInt());
        return_json["status"] = json["status"];
        return return_json;
    }
    catch (const Json::Exception& e)
    {
        std::cerr << e.what() << '\n';
    }
    return Json::nullValue;
}
Json::Value removeNodes( const Json::Value& json) {
    try {
        const Json::Value& args = json["args"];
        if(args.isArray())
            for(int i=0;i<args.size();i++)
                lib.removeObj(args[i]);
    }
    catch (const Json::Exception& e)
    {
        std::cerr << e.what() << '\n';
    }
    return Json::nullValue;
}
Json::Value linkNodes(const Json::Value& json) {
    try {
        const Json::Value& args = json["args"];
        if(args.size()>1)
            lib.link(args[0], args[1]);
    }
    catch (const Json::Exception& e)
    {
        std::cerr << e.what() << '\n';
    }
    return Json::nullValue;
}
Json::Value unlinkNodes(const Json::Value& json) {
    try {
        const Json::Value& args = json["args"];
        if (args.size() > 1)
            lib.unlink(args[0], args[1]);
    }
    catch (const Json::Exception& e)
    {
        std::cerr << e.what() << '\n';
    }
    return Json::nullValue;
}
Json::Value renameNode(const Json::Value& json) {
    try {
        const Json::Value& args = json["args"];
        if (args.size() > 1)
            lib.rename(args[0], args[1]);
    }
    catch (const Json::Exception& e)
    {
        std::cerr << e.what() << '\n';
    }
    return Json::nullValue;
}

Json::Value mergeNodes( const Json::Value& json) {
    try {
        const Json::Value& args = json["args"];
        if (args.size() > 1)
            lib.merge(args[0].asString(), args[1].asString());
    }
    catch (const Json::Exception& e)
    {
        std::cerr << e.what() << '\n';
    }
    return Json::nullValue;
}

Json::Value setInfo(const Json::Value& json) {
    try {
        const Json::Value& args = json["args"];
        if (args.size() > 2)
            lib.setObjkvs(args[0], args[1].asString(), args[2].asString());
    }
    catch (const Json::Exception& e)
    {
        std::cerr << e.what() << '\n';
    }
    return Json::nullValue;
}

Json::Value handle(const Json::Value& json) {
    try {
        auto command = json["name"].asString();
        //std::cout << command << std::endl;
        if(msg_handlers.count(command))
            return msg_handlers[command](json);
    }
    catch (const Json::Exception& e)
    {
        std::cerr << e.what() << '\n';
    }
    return Json::nullValue;
}
Json::Value combo(const Json::Value& json) {
    try {
        const Json::Value& args = json["args"];
        Json::Value return_json;
        //std::cout << args;
        //return return_json;
        if (args.isArray())
            for (int i = 0;i < args.size();i++)
                return_json=handle(args[i]);
        return return_json;
    }
    catch (const Json::Exception& e)
    {
        std::cerr << e.what() << '\n';
    }
    return Json::nullValue;
}
Json::Value save(const Json::Value& json) {
    lib.save();
    return Json::nullValue;
}

Json::Value openExternal(const Json::Value& json) {
    try {
        const Json::Value& args = json["args"];
        browseToFile(args[0].asString());
    }
    catch (const Json::Exception& e)
    {
        std::cerr << e.what() << '\n';
    }
    return Json::nullValue;
}
Json::Value getFiles(const Json::Value& json) {
    std::vector<fileInfo> files;
    const Json::Value& args = json["args"];
    getfiles(to_wide_string(args[0].asString()), files);
    Json::Value return_json=Json::arrayValue;;
    for (int i = 0; i < files.size(); i++) {
        Json::Value node;
        node["name"] = to_byte_string(files[i].name);
        node["time"] = to_byte_string(files[i].time);
        node["size"] = to_byte_string(files[i].size);
        return_json[i] = node;
    }
    return return_json;
}
void register_handlers() {
    msg_handlers[std::string("getRelations")] = handler_fun(getRelations);
    msg_handlers[std::string("removeNodes")] = handler_fun(removeNodes);
    msg_handlers[std::string("linkNodes")] = handler_fun(linkNodes);
    msg_handlers[std::string("unlinkNodes")] = handler_fun(unlinkNodes);
    msg_handlers[std::string("renameNode")] = handler_fun(renameNode);
    msg_handlers[std::string("mergeNodes")] = handler_fun(mergeNodes);
    msg_handlers[std::string("combo")] = handler_fun(combo);
    msg_handlers[std::string("save")] = handler_fun(save);
    msg_handlers[std::string("setInfo")] = handler_fun(setInfo);
    msg_handlers[std::string("openExternal")] = handler_fun(openExternal);
    msg_handlers[std::string("getFiles")] = handler_fun(getFiles);
}





// Define a callback to handle incoming messages
void on_message(server* s, websocketpp::connection_hdl hdl, message_ptr msg) {
    //std::cout << "on_message called with hdl: " << hdl.lock().get()
    //    << " and message: " << msg->get_payload()
    //    << std::endl;
    std::string _msg= msg->get_payload();

    auto jsValue=parse2Json(_msg);
    auto return_json=handle(jsValue);
    if(!return_json.isNull())
        send(s, hdl, return_json);
}

void runServer() {

    lib.load();
    //lib.print();
    // Create a server endpoint
    server echo_server;
    register_handlers();
    //lib.save("data.json");
    try {
        // Set logging settings
        //echo_server.set_access_channels(websocketpp::log::alevel::all);
        echo_server.set_access_channels(websocketpp::log::alevel::none);
        echo_server.clear_access_channels(websocketpp::log::alevel::frame_payload);

        // Initialize Asio
        echo_server.init_asio();

        // Register our message handler
        echo_server.set_message_handler(bind(&on_message, &echo_server, ::_1, ::_2));

        // Listen on port 9002
        echo_server.listen(9002);

        // Start the server accept loop
        echo_server.start_accept();

        // Start the ASIO io_service run loop
        echo_server.run();
    }
    catch (websocketpp::exception const& e) {
        std::cout << e.what() << std::endl;
        lib.save();
    }
    catch (...) {
        lib.save();
        std::cout << "other exception" << std::endl;
    }
}