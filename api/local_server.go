//go:build ignore

package main

import (
	"log"
	"net/http"
	"os"

	"handler"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8787"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/proxy", handler.Handler)

	addr := "127.0.0.1:" + port
	log.Printf("Starting local proxy server on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
