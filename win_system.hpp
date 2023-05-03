#pragma once
#include <windows.h>
#include <ShellApi.h>
#include <shlobj_core.h>
#define _UNICODE
#include <tchar.h>
#include<string>
#include <strsafe.h>

#include <locale>
#include <codecvt>

std::wstring exePath() {
    TCHAR buffer[MAX_PATH] = { 0 };
    GetModuleFileName(NULL, buffer, MAX_PATH);
    std::wstring::size_type pos = std::wstring(buffer).find_last_of(L"\\/");
    return std::wstring(buffer).substr(0, pos);
}

/*
std::wstring to_wide_string(const std::string &str)
{
    int len = MultiByteToWideChar(CP_ACP, 0, str.c_str(), str.size(), NULL, 0);
    LPTSTR wstr = new TCHAR[len + 1];
    MultiByteToWideChar(CP_ACP, 0, str.c_str(), str.size(), wstr, len);
    wstr[len] = '\0';
    return std::wstring(wstr);
}*/

// convert string to wstring
inline std::wstring to_wide_string(const std::string& input)
{
    std::wstring_convert<std::codecvt_utf8<wchar_t>> converter;
    return converter.from_bytes(input);
}
// convert wstring to string 
inline std::string to_byte_string(const std::wstring& input)
{
    //std::wstring_convert<std::codecvt_utf8_utf16<wchar_t>> converter;
    std::wstring_convert<std::codecvt_utf8<wchar_t>> converter;
    return converter.to_bytes(input);
}

void  browseToFile(std::string filename)
{
    //int fail = S_OK; // start as 0
    //fail = fail || CoInitialize(NULL);
    //ITEMIDLIST* pidl = ILCreateFromPath(to_wide_string(filename).c_str());
    //if (pidl) {
    //    fail = fail || SHOpenFolderAndSelectItems(pidl, 0, 0, 0);
    //    ILFree(pidl);
    //    return fail;
    //}
    //else {
    //    return E_FAIL;
    //}
    std::wstring strSel = L"/select,\"";
    strSel += to_wide_string(filename);
    strSel += L"\"";
    ShellExecute(GetDesktopWindow(), L"open",L"explorer.exe",strSel.c_str(), NULL, SW_SHOWNORMAL);
}

void openFile(const std::wstring&file) {
    ShellExecute(GetDesktopWindow(), L"open", file.c_str(), NULL, NULL, SW_SHOWNORMAL);
}


/*
bool openFileDialog(LPWSTR szFileName) {
    OPENFILENAME ofn;
    LPCWSTR FilterSpec = L"All Files(.)\0*.*\0";
    LPCWSTR Title = L"Open....";

    WCHAR szFileTitle[MAX_PATH];

    *szFileName = 0;

    // fill in non-variant fields of OPENFILENAME struct. 
    ofn.lStructSize = sizeof(OPENFILENAME);
    ofn.hwndOwner = GetForegroundWindow();
    ofn.lpstrFilter = FilterSpec;
    ofn.lpstrCustomFilter = NULL;
    ofn.nMaxCustFilter = 0;
    ofn.nFilterIndex = 0;
    ofn.lpstrFile = szFileName;
    ofn.nMaxFile = MAX_PATH;
    ofn.lpstrInitialDir = L"."; // Initial directory.
    ofn.lpstrFileTitle = szFileTitle;
    ofn.nMaxFileTitle = MAX_PATH;
    ofn.lpstrTitle = Title;
    ofn.lpstrDefExt = 0; // I've set to null for demonstration
    ofn.Flags = OFN_FILEMUSTEXIST | OFN_HIDEREADONLY;

    // false if failed or cancelled
    return GetOpenFileName(&ofn);
}*/

typedef std::basic_string<TCHAR> tstring;
struct fileInfo {
    tstring time;
    tstring name;
    tstring size;
};
tstring FileTimeToStr(FILETIME ftWrite)
{
    SYSTEMTIME stUTC, stLocal;
    DWORD dwSize;
    TCHAR szBuf[MAX_PATH];
    // Convert the last-write time to local time.
    FileTimeToSystemTime(&ftWrite, &stUTC);
    SystemTimeToTzSpecificLocalTime(NULL, &stUTC, &stLocal);

    // Build a string showing the date and time.
   StringCchPrintf(szBuf, dwSize,
        TEXT("%d/%02d/%02d  %02d:%02d"),
        stLocal.wYear,stLocal.wMonth, stLocal.wDay,
        stLocal.wHour, stLocal.wMinute);
    return tstring(szBuf);
}
std::string floatToStr(float f, int precision)
{
    std::ostringstream streamObj;
    streamObj << std::fixed;
    streamObj << std::setprecision(precision);
    streamObj << f;
    return streamObj.str();
}
tstring FileSizeToStr(long long len)
{

    if(len <1024 )
        return to_wide_string(floatToStr(len/1024.,2) + " B");
    else if(len<1024*1024)
        return to_wide_string(floatToStr(len / 1024., 2) + " KB");
    else if (len < 1024 * 1024*1024)
        return to_wide_string(floatToStr(len / 1024. / 1024., 2) + " MB");
    else
        return to_wide_string(floatToStr(len / 1024. / 1024. /1024., 2) + " GB");
}
void getfiles(tstring inputstr,std::vector<fileInfo>& files)
{
	TCHAR szDir[MAX_PATH];
	tstring seachstr = inputstr + TEXT("\\*");
	wcscpy_s(szDir, MAX_PATH, seachstr.c_str());

	// Find the first file in the directory.
	WIN32_FIND_DATA ffd;
	HANDLE hFind = FindFirstFile(szDir, &ffd);

	if (INVALID_HANDLE_VALUE == hFind) {
		printf("Error FindFirstFile\n");
		return;
	}

	// List all the files in the directory with some info about them
	do {
		if (ffd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
			if (!_tcscmp(ffd.cFileName, TEXT(".")) || 
			   !_tcscmp(ffd.cFileName, TEXT(".."))) continue;
			tstring dirstr = inputstr + TEXT("\\") + ffd.cFileName;
			//_tprintf(TEXT("  %s   <DIR>\n"), dirstr.c_str());
            getfiles(dirstr,files);
		}
		else {
			LARGE_INTEGER filesize;
			filesize.LowPart = ffd.nFileSizeLow;
			filesize.HighPart = ffd.nFileSizeHigh;
			//_tprintf(TEXT("  %s   %lld bytes\n"), 
			 //ffd.cFileName, filesize.QuadPart);
            tstring time = FileTimeToStr(ffd.ftLastWriteTime);
            tstring name = tstring(ffd.cFileName);
            tstring size = FileSizeToStr(filesize.QuadPart);
            files.push_back(fileInfo{ time,name, size });
		}
	} while (FindNextFile(hFind, &ffd) != 0);

	DWORD dwError;
	dwError = GetLastError();
	if (dwError != ERROR_NO_MORE_FILES) {
		_tprintf(TEXT("Error while FindFile\n"));
	}

	FindClose(hFind);
}