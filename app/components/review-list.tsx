import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Star } from "lucide-react";

interface Review {
  product_title: string;
  reviewer: string;
  review_title: string;
  rating: string;
  review_date: string;
  review_body: string;
}

interface ReviewListProps {
  reviews: Review[];
}

export default function ReviewList({ reviews }: ReviewListProps) {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">
        Scraped Reviews ({reviews.length})
      </h2>
      {reviews.map((review, index) => (
        <Card key={index} className="mb-4">
          <CardHeader>
            <CardTitle>{review.product_title}</CardTitle>
            <CardDescription>
              <div className="flex items-center">
                <span className="mr-2">{review.reviewer}</span>
                <span className="flex items-center">
                  {Array.from({ length: Number.parseInt(review.rating) }).map(
                    (_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-yellow-400 text-yellow-400"
                      />
                    )
                  )}
                </span>
                <span className="ml-2">{review.review_date}</span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold mb-2">{review.review_title}</h3>
            <p>{review.review_body}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
