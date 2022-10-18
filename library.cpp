#include "library.h"
#include<fstream>

ObjectPtr  Library::addObj(const Object& obj) {
	auto iter=objects.find(obj);
	if (iter==objects.end()) {
		auto insert_result=objects.insert(obj);
		iter = insert_result.first;
		database.insert_vertex(objptr(iter));
	}
	else {
		database.insert_vertex(objptr(iter));
	}
	return objptr(iter);
}
void Library::removeObj(const Object& obj) {
	auto iter = objects.find(obj);
	if (iter != objects.end()) {
		database.remove_vertex(objptr(iter));
		objects.erase(iter);
	}
}

Json::Value Library::jsonfy(const Graph& graph) const {
	Json::Value json;
	std::unordered_map<ObjectPtr, size_t> objsmap;
	int i = 0;
	json["nodes"]= Json::arrayValue;
	for (auto p = graph.begin();p != graph.end();p++) {
		objsmap[p->first] = i;
		Json::Value node=p->first->jsonfy();
		json["nodes"][i++] = node;
	}
	json["links"]= Json::arrayValue;
	int j = 0;
	for (auto p = graph.begin();p != graph.end();p++) {
		const auto & out = graph.out_neighbors(p);
		int i= objsmap[p->first];
		for (auto q = out.begin();
			q != out.end(); q++) {
			Json::Value link;
			link["source"] = i;
			link["target"] = objsmap[*q];
			json["links"][j++] =link;
		}
	}
	return json;
}

void Library::addToGraph(const Json::Value& json){
	std::unordered_map<size_t, ObjectPtr> objsmap;
	try {
		const Json::Value& nodes = json["nodes"];
		const Json::Value& links = json["links"];
		if (nodes.isArray())
			for (int i = 0;i < nodes.size();i++) {
				auto objPtr=addObj(Object(nodes[i]));
				objsmap[i] = objPtr;
			}
		if(links.isArray())
			for (int i = 0;i < links.size();i++) {
				int a= links[i]["source"].asInt();
				int b=links[i]["target"].asInt();
				link(*objsmap[a], *objsmap[b]);
			}
	}
	catch (const Json::Exception& e)
	{
		std::cerr << e.what() << '\n';
	}
}

void Library::link(const  Object& obj1, const  Object& obj2) {
	auto objptr1 = addObj(obj1);
	auto objptr2 = addObj(obj2);
	database.insert_undirected_edge(objptr1, objptr2);
}
void Library::unlink(const  Object& obj1, const  Object& obj2) {
	if (objects.count(obj1) && objects.count(obj2)) {
		database.remove_undirected_edge(objptr(objects.find(obj1)), objptr(objects.find(obj2)));
	}
}
void Library::rename(const Object& from, const Object& to) {
	if (from == to)
		return;

	if (objects.count(from)) {
		auto objptr_to=addObj(to);
		auto objptr_from = objptr(objects.find(from));
		const_cast<Object*>(objptr_to)->copy_kvs(*objptr_from);
		database.absorb(objptr_to, objptr_from);
		removeObj(from);
	}
}
void Library::merge(const Object& from, const Object& to) {
	if(objects.count(from)&& objects.count(to))
		rename(from,to);
}


void Library::clean() {
	std::unordered_set<ObjectPtr> toRemove;
	for (const auto & obj : objects) {
		if (database.degree(&(obj)) == 0) {
			toRemove.insert(&(obj));
		}
	}
	for (const auto& objptr : toRemove) {
		removeObj(*objptr);
	}
}

Json::Value Library::getRelations(const Object& obj,int depth) const {
	//std::cout <<"test: "<< obj << std::endl;
	Graph::vertex_set A;
	if (!objects.count(obj)) A = {};
	else {
		database.dfs_search(objptr(objects.find(obj)), depth, A);
	}
	auto graph = database.subgraph(A);
	return jsonfy(graph);
}

void  Library::setObjkvs(const Object& obj, const Text& key, const Text& value) {
	if (objects.count(obj)) {
		auto pobj = objptr(objects.find(obj));
		const_cast <Object*>(pobj)->set_kvs(key,value);
	}
}


void Library::load(const std::string& file) {
	std::ifstream fin(file.c_str(), std::ios::binary);

	Json::Value data;
	fin >> data;
	addToGraph(data);
}
void Library::save(const std::string& file) const {
	std::ofstream fout(file.c_str(), std::ios::binary);

	fout<<jsonfy(database);
}

void Library::print() const {
	std::cout << "# nodes:" << objects.size() << "\n";
	for (const auto& p : objects)
		std::cout << p<<std::endl;
	std::cout << "graph:\n";
	std::cout << "# vertices: " << database.num_vertices() << "\n";
	std::cout << "# edges:    " << database.num_edges() << "\n";
	for (auto p = database.begin();p != database.end();p++) {
		const auto& out = database.out_neighbors(p);

		for (auto q = out.begin();q != out.end(); q++)
			std::cout << *(p->first) << "  -->  " << *(*q) << "\n";
	}
	std::cout << std::endl;
}