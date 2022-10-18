#include "json/json.h"

std::string json_stringify(const Json::Value& json) {
    std::string str;
    try {
        if (!json.isNull()) {
            Json::StreamWriterBuilder jswBuilder;
            std::ostringstream os;
            jswBuilder["emitUTF8"] = true;
            jswBuilder["indentation"] = "";
            std::unique_ptr<Json::StreamWriter>jsWriter(jswBuilder.newStreamWriter());
            jsWriter->write(json, &os);
            str = os.str();

        }

    }
    catch (std::exception const& e) {
        std::cout << "Echo failed because: "
            << "(" << e.what() << ")" << std::endl;
    }
    return str;
}

Json::Value parse2Json(const std::string& str) {
    Json::Value jsValue;
    Json::String jsErrors;
    Json::CharReaderBuilder jcrBuilder;
    jcrBuilder["collectComments"] = false;
    std::unique_ptr<Json::CharReader>jcReader(jcrBuilder.newCharReader());


    const auto is_parsed = jcReader->parse(str.c_str(), str.c_str() + str.size(), &jsValue, &jsErrors);
    if (!is_parsed)
    {
        std::cerr << "ERROR: Could not parse! " << jsErrors << '\n';
    }

    //std::cout << "Parsed JSON:\n" << jsValue << "\n\n";
    return jsValue;
}