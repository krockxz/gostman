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

	export class CookieInfo {
	    name: string;
	    value: string;
	    domain: string;
	    path: string;
	    expires: string;
	    secure: boolean;
	    httpOnly: boolean;

	    static createFrom(source: any = {}) {
	        return new CookieInfo(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.value = source["value"];
	        this.domain = source["domain"];
	        this.path = source["path"];
	        this.expires = source["expires"];
	        this.secure = source["secure"];
	        this.httpOnly = source["httpOnly"];
	    }
	}

	export class ResponseMsg {
	    body: string;
	    status: string;
	    headers: HeaderEntry[];
	    cookies: CookieInfo[];
	    size: number;

	    static createFrom(source: any = {}) {
	        return new ResponseMsg(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.body = source["body"];
	        this.status = source["status"];
	        this.headers = source["headers"];
	        this.cookies = source["cookies"];
	        this.size = source["size"];
	    }
	}

	export class HeaderEntry {
	    key: string;
	    value: string;

	    static createFrom(source: any = {}) {
	        return new HeaderEntry(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.key = source["key"];
	        this.value = source["value"];
	    }
	}

}
