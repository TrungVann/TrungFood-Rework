"use client";
import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Search,
  Trash,
  Eye,
  Plus,
  BarChart,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import axiosInstance from "apps/seller-ui/src/utils/axiosInstance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import DeleteConfirmationModal from "apps/seller-ui/src/shared/components/modals/delete.confirmation.modal";
import BreadCrumbs from "apps/seller-ui/src/shared/components/breadcrumbs";
import AnalyticsModal from "apps/seller-ui/src/shared/components/modals/analytics.modal";

const fetchProducts = async () => {
  const res = await axiosInstance.get("/product/api/get-shop-products");
  const products = res.data.products?.filter((i: any) => !i.starting_date);
  return products;
};

const deleteProduct = async (productId: string) => {
  await axiosInstance.delete(`/product/api/delete-product/${productId}`);
};

const restoreProduct = async (productId: string) => {
  await axiosInstance.put(`/product/api/restore-product/${productId}`);
};

const ProductList = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["shop-products"],
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 5,
  });

  // Delete Product Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-products"] });
      setShowDeleteModal(false);
    },
  });

  // Restore Product Mutation
  const restoreMutation = useMutation({
    mutationFn: restoreProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-products"] });
      setShowDeleteModal(false);
    },
  });

  const columns = useMemo(
    () => [
      {
        accessorKey: "image",
        header: "Hình ảnh",
        cell: ({ row }: any) => {
          return (
            <Image
              src={row.original.images[0]?.url}
              alt={row.original.images[0]?.url}
              width={200}
              height={200}
              className="w-14 h-14 rounded-lg object-cover shadow-sm"
            />
          );
        },
      },
      {
        accessorKey: "name",
        header: "Tên sản phẩm",
        cell: ({ row }: any) => {
          const truncatedTitle =
            row.original.title.length > 30
              ? `${row.original.title.substring(0, 30)}...`
              : row.original.title;

          return (
            <Link
              href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/product/${row.original.slug}`}
              className="text-blue-400 hover:text-blue-300 hover:underline transition font-medium"
              title={row.original.title}
            >
              {truncatedTitle}
            </Link>
          );
        },
      },
      {
        accessorKey: "price",
        header: "Giá",
        cell: ({ row }: any) => (
          <span className="font-semibold text-green-400">
            ${row.original.sale_price}
          </span>
        ),
      },
      {
        accessorKey: "stock",
        header: "Tồn kho",
        cell: ({ row }: any) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              row.original.stock < 10
                ? "bg-red-500/20 text-red-400"
                : "bg-green-500/20 text-green-400"
            }`}
          >
            {row.original.stock} còn lại
          </span>
        ),
      },
      {
        accessorKey: "category",
        header: "Danh mục",
        cell: ({ row }: any) => (
          <span className="text-gray-300">{row.original.category}</span>
        ),
      },
      {
        accessorKey: "rating",
        header: "Đánh giá",
        cell: ({ row }: any) => (
          <div className="flex items-center gap-1.5">
            <Star fill="#fbbf24" stroke="#fbbf24" size={16} />
            <span className="text-yellow-400 font-medium">
              {row.original.ratings || 5}
            </span>
          </div>
        ),
      },
      {
        header: "Hành động",
        cell: ({ row }: any) => (
          <div className="flex gap-2">
            <Link
              href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/product/${row.original.slug}`}
              className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition"
              title="Xem chi tiết"
            >
              <Eye size={16} />
            </Link>
            <button
              className="p-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg transition"
              onClick={() => openAnalytics(row.original)}
              title="Xem thống kê"
            >
              <BarChart size={16} />
            </button>
            <button
              className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition"
              onClick={() => openDeleteModal(row.original)}
              title="Xóa sản phẩm"
            >
              <Trash size={16} />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString",
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Handle Opening Analytics Modal
  const openAnalytics = (product: any) => {
    setAnalyticsData(product);
    setShowAnalytics(true);
  };

  const openDeleteModal = (product: any) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  return (
    <div className="w-full min-h-screen p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h2 className="text-3xl text-white font-bold mb-1">
            Tất cả sản phẩm
          </h2>
          <p className="text-gray-400 text-sm">
            Quản lý danh sách sản phẩm của bạn
          </p>
        </div>
        <Link
          href="/dashboard/create-product"
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-blue-500/30 transition font-medium"
        >
          <Plus size={18} /> Thêm sản phẩm
        </Link>
      </div>

      {/* Breadcrumbs */}
      <div className="mb-4">
        <BreadCrumbs title="Tất cả sản phẩm" />
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex items-center bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-3 rounded-xl shadow-lg">
        <Search size={20} className="text-gray-400 mr-3" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên sản phẩm, danh mục..."
          className="w-full bg-transparent text-white placeholder:text-gray-500 outline-none text-sm"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-2xl">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-gray-400">Đang tải sản phẩm...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr
                      key={headerGroup.id}
                      className="border-b border-gray-700/50 bg-gray-900/50"
                    >
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="p-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-gray-700/30 hover:bg-gray-700/30 transition"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-4 text-sm">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {products?.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-900/30 border-t border-gray-700/50">
                <div className="text-sm text-gray-400">
                  Hiển thị {table.getState().pagination.pageIndex * 10 + 1} đến{" "}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * 10,
                    table.getFilteredRowModel().rows.length
                  )}{" "}
                  trong tổng số {table.getFilteredRowModel().rows.length} sản
                  phẩm
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="p-2 bg-gray-700/50 text-white rounded-lg hover:bg-gray-600/50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-white text-sm font-medium px-3">
                    Trang {table.getState().pagination.pageIndex + 1} /{" "}
                    {table.getPageCount()}
                  </span>
                  <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="p-2 bg-gray-700/50 text-white rounded-lg hover:bg-gray-600/50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {!isLoading && products?.length === 0 && (
          <div className="p-12 text-center">
            <div className="inline-block p-4 bg-gray-700/50 rounded-full mb-4">
              <Plus size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-400 text-lg mb-2">Chưa có sản phẩm nào</p>
            <p className="text-gray-500 text-sm">
              Hãy thêm sản phẩm đầu tiên của bạn!
            </p>
          </div>
        )}

        {/* Analytics Modal */}
        {showAnalytics && (
          <AnalyticsModal
            product={analyticsData}
            onClose={() => setShowAnalytics(false)}
          />
        )}

        {showDeleteModal && (
          <DeleteConfirmationModal
            product={selectedProduct}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={() => deleteMutation.mutate(selectedProduct?.id)}
            onRestore={() => restoreMutation.mutate(selectedProduct?.id)}
          />
        )}
      </div>
    </div>
  );
};

export default ProductList;
