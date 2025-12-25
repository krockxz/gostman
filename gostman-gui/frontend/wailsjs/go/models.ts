export namespace main {
	
	export class Request {
	    id: string;
	    name: string;
	    url: string;
	    method: string;
	    headers: string;
	    body: string;
	    queryParams: string;
	    response: string;
	
	    static createFrom(source: any = {}) {
	        return new Request(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.url = source["url"];
	        this.method = source["method"];
	        this.headers = source["headers"];
	        this.body = source["body"];
	        this.queryParams = source["queryParams"];
	        this.response = source["response"];
	    }
	}
	export class ResponseMsg {
	    body: string;
	    status: string;
	
	    static createFrom(source: any = {}) {
	        return new ResponseMsg(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.body = source["body"];
	        this.status = source["status"];
	    }
	}

}

