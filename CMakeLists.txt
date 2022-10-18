cmake_minimum_required(VERSION 2.8.12)
project(library)


include_directories(".\\include")
link_directories(".\\lib")


add_definitions(-DASIO_STANDALONE -D_WEBSOCKETPP_CPP11_INTERNAL_ -DUNICODE)

add_executable(library main.cpp library.cpp)
target_link_libraries(library jsoncpp)