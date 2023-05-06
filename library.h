#pragma once
#include<string>
//#include<map>
#include<vector>
#include<unordered_map>

#include "json/json.h"

#include "ngraph.hpp"
using namespace NGraph;

#include"tika.hpp"
#include <functional>


typedef std::string Text;

class Object :public std::string {
public:
	Object(const std::string& str) :std::string(str) { };
	//Object(const Json::Value&v) :order(0) {
	//	if (v.isObject()) {
	//		if (v.isMember("name"))
	//			*this = v["name"].asString();
	//		if (v.isMember("order"))
	//			order = v["order"].asInt();
	//	}
	//	else
	//		*this = v.asString();
	//};
	Object(const Json::Value& v):std::string(v.isObject()?v["name"].asString():v.asString()) {
		if (v.isObject()) {
			for (const auto& k : v.getMemberNames()) {
				if(k!="name")
					optional_kvs[k] = v[k].asString();
			}
		}
	};

	Json::Value jsonfy() const {
		Json::Value v;
		v["name"] = std::string(*this);
		for (const auto& kv : optional_kvs) {
			v[kv.first] = kv.second;
		}
		return v;
	};
	short get_order() const{ return optional_kvs.count("order")? std::stoi(optional_kvs.at("order")) :0; };
	void set_kvs(const Text& key, const Text& value) { optional_kvs[key] = value; };

	void copy_kvs(const Object& obj) {
		for (const auto& kv : obj.optional_kvs) {
			optional_kvs[kv.first] = kv.second;
		}
	};
private:
	//hash value should not depend on below members
	std::unordered_map<Text, Text> optional_kvs;
};


template <>
struct std::hash<Object>
{
	std::size_t operator()(const Object& obj) const
	{
		using std::size_t;
		using std::hash;
		using std::string;
		return std::hash<std::string>()(obj);
	}
};


typedef const Object* ObjectPtr;

template<>
void tGraph<ObjectPtr>::dfs_search(const tGraph<ObjectPtr>::vertex& v, size_t depth, tGraph<ObjectPtr>::vertex_set& visited) const{
	visited.insert(v);
	if (depth != 0)
	{
		vertex_set neighbors = out_neighbors(v);
		if (is_undirected())
		{
			neighbors += in_neighbors(v);
		}
		for (const auto& neighbor : neighbors)
		{
			if (!visited.count(neighbor))
			{
				dfs_search(neighbor, depth - 1, visited);
			}
		}
	}
	else
	{
		vertex v_current=v;
		bool next_found = false;
		do {
			vertex_set neighbors = out_neighbors(v_current);
			if (is_undirected())
			{
				neighbors += in_neighbors(v_current);
			}
			next_found = false;
			if (v_current->get_order() == 0) {
				for (const auto& neighbor : neighbors)
				{
					if (!visited.count(neighbor) &&
						(neighbor->get_order())  > (v_current->get_order()))
					{
						next_found = true;
						v_current = neighbor;
						visited.insert(v_current);
						break;
					}
				}
			}
		} while (next_found == true);
	}
}


class Library
{
public:
	//typedef std::string Object;
	//typedef std::shared_ptr<Object> ObjectPtr;
	typedef tGraph<ObjectPtr> Graph;
	typedef std::unordered_set<Object> ObjSet;


	Library() {
		database.set_undirected();
	};
	void link(const Object& obj1, const Object& obj2);
	void unlink(const Object& obj1, const Object& obj2);

	void rename(const Object& from, const Object& to);
	void merge(const Object& from, const Object& to);



	void clean();

	Json::Value getRelations(const Object& obj, int depth = -1) const;

	void setObjkvs(const Object& obj,const Text&key,const Text& value);

	void print() const;

	void load(const std::string& file= "data.json");
	void save(const std::string &file= "data.json") const;
	void backup(const std::string& file = "data.json") const;

	ObjectPtr addObj(const Object& obj);
	void removeObj(const Object& obj);
	void removeConnected(const Object& obj);
private:
	Json::Value jsonfy(const Graph & graph) const;
	void addToGraph(const Json::Value &json);

	ObjectPtr objptr(ObjSet::const_iterator it) const {
		return &(*it);
	};

	Graph database;
	ObjSet objects;

};


