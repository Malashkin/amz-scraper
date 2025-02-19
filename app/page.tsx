"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import ReviewList from "./components/review-list";

export default function Home() {
  const [urls, setUrls] = useState<string>("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setStatus("Starting scraping process...");
    setReviews([]);

    try {
      const urlArray = urls
        .split("\n")
        .map((url) => url.trim())
        .filter((url) => url !== "");
      setStatus(`Scraping ${urlArray.length} URLs...`);

      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ urls: urlArray }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to scrape reviews");
      }

      setReviews(data);
      setStatus(`Scraped ${data.length} reviews successfully.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      setStatus("Scraping failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReviews = (format: "txt" | "csv") => {
    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === "txt") {
      content = reviews
        .map(
          (review) =>
            `Product: ${review.product_title}\nReviewer: ${review.reviewer}\nRating: ${review.rating}\nDate: ${review.review_date}\nTitle: ${review.review_title}\nReview: ${review.review_body}\n\n`
        )
        .join("---\n");
      filename = "amazon_reviews.txt";
      mimeType = "text/plain";
    } else {
      // CSV format
      const headers = [
        "Product",
        "Reviewer",
        "Rating",
        "Date",
        "Title",
        "Review",
      ];
      const csvContent = [
        headers.join(","),
        ...reviews.map((review) =>
          [
            review.product_title,
            review.reviewer,
            review.rating,
            review.review_date,
            review.review_title,
            review.review_body,
          ]
            .map((field) => `"${field.replace(/"/g, '""')}"`)
            .join(",")
        ),
      ].join("\n");
      content = csvContent;
      filename = "amazon_reviews.csv";
      mimeType = "text/csv";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Amazon Review Scraper</h1>
      <Card>
        <CardHeader>
          <CardTitle>Enter Amazon Product URLs</CardTitle>
          <CardDescription>
            Add one or more Amazon product URLs to scrape reviews (one URL per
            line)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Textarea
              placeholder="https://www.amazon.com/product-url-1&#10;https://www.amazon.com/product-url-2"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              rows={5}
              className="mb-4"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Scraping..." : "Scrape Reviews"}
            </Button>
          </form>
        </CardContent>
      </Card>
      {status && (
        <Alert className="mt-4">
          <AlertTitle>Status</AlertTitle>
          <AlertDescription>{status}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {reviews.length > 0 && (
        <div className="mt-4 space-x-2">
          <Button onClick={() => handleSaveReviews("csv")}>
            Save Reviews as CSV
          </Button>
          <ReviewList reviews={reviews} />
        </div>
      )}
    </main>
  );
}
