#pragma once
#include"HTTPRequest.hpp"
#include<fstream>
#include<iterator>
class http_req {
public:
    http_req(const std::string& _url) :request(_url) {};
    std::string put(const std::string& inputFile) {
        try
        {
            std::ifstream infile(inputFile, std::ios_base::binary);
            std::string content{ std::istreambuf_iterator<char>(infile), std::istreambuf_iterator<char>() };
            const auto response = request.send("PUT", content, {
                {"Accept", "application/json"}
                });
            //std::ofstream out("out.html", std::ios_base::binary);
            //out.write((char*)response.body.data(), response.body.size());
            return std::string{ response.body.begin(), response.body.end() };
        }
        catch (const std::exception& e)
        {
            std::cerr << "Request failed, error: " << e.what() << '\n';
        }
        return "";
    }
private:
    http::Request request;
};