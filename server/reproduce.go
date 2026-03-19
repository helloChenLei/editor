package main

import (
	"database/sql"
	"fmt"
	"log"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	dbPath := filepath.Join("data", "shares.db")
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	var content, style string
	err = db.QueryRow("SELECT content, style FROM shares WHERE id = ?", "85e12d5f").Scan(&content, &style)
	if err != nil {
		log.Fatal(err)
	}

	title := "测试标题"
	description := "测试描述"

	result := fmt.Sprintf(`
    .mermaid svg {
      max-width: 100%%;
      height: auto;
    }
    
    title: %s,
    description: %s,
    markdownContent: %q,
    style: %q,
`, title, description, content, style)

	fmt.Println(result[:500])
}
