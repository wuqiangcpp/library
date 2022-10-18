// library.cpp : 此文件包含 "main" 函数。程序执行将在此处开始并结束。
//

#include <iostream>
#include "server.hpp"

#include"win_system.hpp"


template<class T>
void printVec(const std::vector<T>& vec) {
    for(auto v:vec)
        std::cout << v << " ";
    std::cout<<std::endl;
}




int main()
{
    //http_req h("http://localhost:9998//tika");
    //Json::Value re= parse2Json(h.put("./test3.pdf"));
    //for (const auto &k: re.getMemberNames())
    //    std::cout << k<< std::endl;
    //std::cout << re << std::endl;
    //std::cout << re["dc:creator"] << std::endl;
    //std::cout << re["dc:title"] << std::endl;
    //std::cout << re["dcterms:created"] << std::endl;
    //std::cout << re["dcterms:modified"] << std::endl;
    
    //browseToFile(L"E:\\library_files\\Flamini_2019_Rep._Prog._Phys._82_016001.pdf");
    //WCHAR openedFileName[MAX_PATH];
    //if (openFileDialog(openedFileName))
    //{
    //    std::wcout << std::wstring(openedFileName) << std::endl;
    //}
    
    //std::wstring file =std::wstring(L"E:\\bwzy\\library\\library\\client\\client.html");
    std::wstring file =exePath()+ std::wstring(L"\\client\\client.html");
    openFile(file);



    runServer();
    return 0;
}

// 运行程序: Ctrl + F5 或调试 >“开始执行(不调试)”菜单
// 调试程序: F5 或调试 >“开始调试”菜单

// 入门使用技巧: 
//   1. 使用解决方案资源管理器窗口添加/管理文件
//   2. 使用团队资源管理器窗口连接到源代码管理
//   3. 使用输出窗口查看生成输出和其他消息
//   4. 使用错误列表窗口查看错误
//   5. 转到“项目”>“添加新项”以创建新的代码文件，或转到“项目”>“添加现有项”以将现有代码文件添加到项目
//   6. 将来，若要再次打开此项目，请转到“文件”>“打开”>“项目”并选择 .sln 文件
